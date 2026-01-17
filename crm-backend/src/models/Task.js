import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  taskNumber: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  taskType: {
    type: String,
    enum: ['Call', 'Meeting', 'Email', 'Follow-up', 'Documentation', 'Service', 'General', 'Other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Completed', 'Cancelled', 'On Hold'],
    default: 'To Do'
  },
  dueDate: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    default: 0
  },
  actualHours: {
    type: Number,
    default: 0
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedTo: {
    module: {
      type: String,
      enum: ['Client', 'Lead', 'Quotation', 'Invoice', 'AMC'],
      default: null
    },
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedTo.module'
    }
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  subTasks: [{
    title: String,
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Completed'],
      default: 'To Do'
    },
    completedAt: Date
  }],
  reminders: [{
    reminderDate: Date,
    reminderSent: {
      type: Boolean,
      default: false
    }
  }],
  comments: [{
    comment: String,
    commentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    commentedAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto-generate task number
taskSchema.pre('save', async function(next) {
  if (this.isNew && !this.taskNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Task').countDocuments();
    this.taskNumber = `TSK${year}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

taskSchema.index({ taskNumber: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ 'relatedTo.module': 1 });
taskSchema.index({ 'relatedTo.recordId': 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
