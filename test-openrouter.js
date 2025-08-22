#!/usr/bin/env node

// Test script to verify OpenRouter integration
import OpenAI from 'openai';

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.error('Please set OPENROUTER_API_KEY environment variable');
  process.exit(1);
}

const client = new OpenAI({
  apiKey,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/openrouter-code-cli',
    'X-Title': 'OpenRouter Code CLI Test'
  }
});

async function testConnection() {
  try {
    console.log('Testing OpenRouter connection...');
    
    const response = await client.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "OpenRouter connection successful!" and nothing else.' }
      ],
      max_tokens: 50,
      temperature: 0.7
    });

    console.log('Response:', response.choices[0].message.content);
    console.log('\n✅ OpenRouter integration is working!');
    console.log('Model used:', response.model);
    console.log('Usage:', response.usage);
    
  } catch (error) {
    console.error('❌ Error connecting to OpenRouter:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testConnection();