import { Configuration, OpenAIApi } from 'npm:openai@^4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  content: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Parse request body
    const { content } = await req.json() as RequestBody;
    if (!content) {
      throw new Error('No content provided');
    }

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    // Construct the prompt
    const prompt = `
      Given the following content, create 5-10 multiple choice questions. For each question:
      1. Extract a key concept
      2. Create a clear question about that concept
      3. Provide four possible answers, with only one being correct
      4. Include a brief explanation for why the correct answer is right
      
      Format the output as a JSON array of objects with the following structure:
      {
        "question_text": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer": "The correct option text",
        "explanation": "Brief explanation of why this is correct"
      }

      Content to process:
      ${content}
    `;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates multiple choice questions. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Parse the response
    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate the JSON response
    const questions = JSON.parse(responseText);
    if (!Array.isArray(questions)) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Return the questions with CORS headers
    return new Response(
      JSON.stringify({ questions }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    
    // Return error response with CORS headers
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while generating questions',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});