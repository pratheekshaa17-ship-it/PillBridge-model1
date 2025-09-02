require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var medicationsRouter = require('./routes/medications');
var remindersRouter = require('./routes/reminders');
var moodEntriesRouter = require('./routes/mood_entries');
var moodNotificationsRouter = require('./routes/mood_notifications');
var gameScoresRouter = require('./routes/game_scores');
var emergencyRouter = require('./routes/emergency');
var uploadRouter = require('./routes/upload');
var imagesRouter = require('./routes/images');
var messagesRouter = require('./routes/messages');
console.log('Loading PDF reports router...');
var pdfReportsRouter = require('./routes/pdf_reports');
var aiRouter = require('./routes/ai');
console.log('PDF reports router loaded successfully!');

var app = express();

app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/medications', medicationsRouter);
app.use('/reminders', remindersRouter);
app.use('/mood_entries', moodEntriesRouter);
app.use('/mood_notifications', moodNotificationsRouter);
app.use('/game_scores', gameScoresRouter);
app.use('/emergency', emergencyRouter);
app.use('/upload', uploadRouter);
app.use('/images', imagesRouter);
app.use('/messages', messagesRouter);
app.use('/ai', aiRouter);
console.log('Registering PDF reports route...');
app.use('/pdf-reports', pdfReportsRouter);
console.log('PDF reports route registered at /pdf-reports');

module.exports = app;
