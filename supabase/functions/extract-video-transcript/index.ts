const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  videoUrl: string;
}

interface TranscriptResponse {
  transcript: string;
}

// Function to extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
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
    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY is not set in environment variables');
    }

    // Parse request body
    const { videoUrl } = await req.json() as RequestBody;
    if (!videoUrl || !videoUrl.trim()) {
      throw new Error('No video URL provided');
    }

    console.log('Processing video URL:', videoUrl);

    // Extract YouTube video ID
    const videoId = extractYouTubeVideoId(videoUrl.trim());
    if (!videoId) {
      throw new Error('Invalid YouTube URL. Please provide a valid YouTube video URL.');
    }

    console.log('Extracted video ID:', videoId);

    // Construct RapidAPI URL
    const rapidApiUrl = `https://youtube-transcription-api-and-youtube-translation-api.p.rapidapi.com/transcripts/${videoId}/translations/en?source_language=en&format=structured`;
    
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'youtube-transcription-api-and-youtube-translation-api.p.rapidapi.com'
      }
    };

    console.log('Calling RapidAPI for transcript...');

    // Call RapidAPI
    const response = await fetch(rapidApiUrl, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('RapidAPI error:', response.status, errorText);
      
      if (response.status === 404) {
        throw new Error('Video transcript not found. The video may not have captions available or may be private.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Please check if the video has available captions.');
      } else {
        throw new Error(`Failed to fetch transcript: ${response.status} - ${errorText}`);
      }
    }

    const result = await response.text();
    console.log('Received transcript data from RapidAPI');

    // Parse the structured response
    let transcriptData;
    try {
      transcriptData = JSON.parse(result);
    } catch (parseError) {
      console.error('Failed to parse transcript JSON:', parseError);
      throw new Error('Invalid transcript format received from API');
    }

    // Extract text from structured transcript
    let transcriptText = '';
    
    if (transcriptData && Array.isArray(transcriptData)) {
      // Handle array format
      transcriptText = transcriptData
        .map((item: any) => item.text || item.content || '')
        .filter(text => text.trim())
        .join(' ');
    } else if (transcriptData && transcriptData.transcript) {
      // Handle object with transcript property
      if (Array.isArray(transcriptData.transcript)) {
        transcriptText = transcriptData.transcript
          .map((item: any) => item.text || item.content || '')
          .filter(text => text.trim())
          .join(' ');
      } else {
        transcriptText = transcriptData.transcript;
      }
    } else if (transcriptData && transcriptData.text) {
      // Handle object with text property
      transcriptText = transcriptData.text;
    } else if (typeof transcriptData === 'string') {
      // Handle plain text response
      transcriptText = transcriptData;
    } else {
      // Try to extract any text content from the response
      const extractText = (obj: any): string => {
        if (typeof obj === 'string') return obj;
        if (Array.isArray(obj)) {
          return obj.map(extractText).filter(Boolean).join(' ');
        }
        if (obj && typeof obj === 'object') {
          const textFields = ['text', 'content', 'transcript', 'caption'];
          for (const field of textFields) {
            if (obj[field]) {
              return extractText(obj[field]);
            }
          }
          // If no specific text fields, try to extract from all values
          return Object.values(obj).map(extractText).filter(Boolean).join(' ');
        }
        return '';
      };
      
      transcriptText = extractText(transcriptData);
    }

    if (!transcriptText || !transcriptText.trim()) {
      throw new Error('No transcript text could be extracted from the video. The video may not have captions available.');
    }

    // Clean up the transcript text
    transcriptText = transcriptText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    console.log(`Successfully extracted transcript: ${transcriptText.length} characters`);

    // Return the transcript with CORS headers
    return new Response(
      JSON.stringify({ 
        transcript: transcriptText,
        videoId: videoId,
        length: transcriptText.length
      } as TranscriptResponse & { videoId: string; length: number }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error in extract-video-transcript function:', error);
    
    // Return error response with CORS headers
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while extracting video transcript',
        details: error.stack || 'No additional details available'
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