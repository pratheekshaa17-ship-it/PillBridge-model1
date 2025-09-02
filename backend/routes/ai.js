const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { connectDb } = require('../db'); // Corrected to use connectDb
const { ObjectId } = require('mongodb');

if (!process.env.OPENAI_API_KEY) {
  console.error("FATAL ERROR: OPENAI_API_KEY is not defined in .env file.");
  // process.exit(1); // Don't exit in dev, but log error
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const constructSystemPrompt = (patient, medications, moodEntries, userPrompt) => {
  let prompt = `You are an expert medical AI assistant for a caregiver. Your role is to analyze patient data and provide clear, concise, and helpful answers. Be professional and empathetic.

Here is the patient's data:
- Name: ${patient.full_name}
- Age: (Not provided in schema)
- Gender: (Not provided in schema)

Medications:
${medications.length > 0 ? medications.map(m => `- ${m.name} (${m.dosage})`).join('\n') : 'No medications listed.'}

Recent Mood Logs (last 7 days):
${moodEntries.length > 0 ? moodEntries.map(e => `- Date: ${new Date(e.date).toLocaleDateString()}, Score: ${e.mood_score}/5, Notes: ${e.notes || 'N/A'}`).join('\n') : 'No recent mood logs.'}

Based on this data, please answer the following question from the caregiver. If the question is outside the scope of the provided data (e.g., asking for a diagnosis), politely decline and advise consulting a doctor.

Caregiver's question: "${userPrompt}"`;

  return prompt;
};

// POST /ai/chat
router.post('/chat', async (req, res) => {
  console.log('--- AI Chat Request Received ---');
  const { patientId, prompt } = req.body;
  console.log(`[AI] Request for patientId: ${patientId}, Prompt: "${prompt}"`);

  if (!patientId || !prompt) {
    console.error('[AI] Validation Error: patientId and prompt are required.');
    return res.status(400).json({ error: 'patientId and prompt are required' });
  }

  try {
    const db = await connectDb();
    console.log('[AI] Fetching patient from DB...');
    const patient = await db.collection('users').findOne({ _id: new ObjectId(patientId) });

    if (!patient) {
      console.error(`[AI] Patient with ID ${patientId} not found.`);
      return res.status(404).json({ error: 'Patient not found' });
    }
    console.log(`[AI] Found patient: ${patient.full_name}`);

    console.log('[AI] Fetching medications...');
    const medications = await db.collection('medications').find({ patient_id: patientId }).toArray();
    console.log(`[AI] Found ${medications.length} medications.`);

    console.log('[AI] Fetching recent mood entries...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const moodEntries = await db.collection('mood_entries').find({ patient_id: patientId, date: { $gte: sevenDaysAgo.toISOString() } }).sort({ date: -1 }).toArray();
    console.log(`[AI] Found ${moodEntries.length} mood entries.`);

    const systemPrompt = constructSystemPrompt(patient, medications, moodEntries, prompt);
    console.log('[AI] Constructed System Prompt:', systemPrompt);

    console.log('[AI] Sending request to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
    });

    const aiResponse = completion.choices[0].message.content;
    console.log('[AI] Received response from OpenAI:', aiResponse);

    console.log('[AI] Saving conversation to chat_history...');
    const chatMessage = { patient_id: patientId, sender: 'user', content: prompt, timestamp: new Date() };
    const aiMessage = { patient_id: patientId, sender: 'ai', content: aiResponse, timestamp: new Date() };
    await db.collection('chat_history').insertMany([chatMessage, aiMessage]);
    console.log('[AI] Conversation saved.');

    res.json({ response: aiResponse });

  } catch (error) {
    console.error('--- [AI] Critical Error ---');
    console.error(error);
    res.status(500).json({ error: 'Failed to get AI response due to a server error.' });
  }
});

// GET /ai/chat/:patientId
router.get('/chat/:patientId', async (req, res) => {
  const { patientId } = req.params;
  if (!patientId) {
    return res.status(400).json({ error: 'patientId is required' });
  }
  try {
    const db = await connectDb();
    const history = await db.collection('chat_history').find({ patient_id: patientId }).sort({ timestamp: 1 }).toArray();
    res.json(history);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

module.exports = router;
