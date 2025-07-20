// app/api/upload/route.ts
export async function POST(request: Request) {
  console.log('🎯 POST route hit! Request received');
  
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    
    console.log('📁 Files received:', files.length);
    console.log('📁 File names:', files.map(f => f.name));
    
    // Create a streaming response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        // Send initial status
        const statusData = JSON.stringify({
          type: 'status',
          message: 'Starting image analysis...'
        });
        controller.enqueue(encoder.encode(statusData + '\n'));

        // Send progress updates
        const progressData = JSON.stringify({
          type: 'progress',
          value: 25
        });
        controller.enqueue(encoder.encode(progressData + '\n'));

        // Simulate analysis result (replace with your actual logic)
        setTimeout(() => {
          const analysisData = JSON.stringify({
            type: 'analysis',
            result: {
              model: 'Test Product Model',
              brand: 'Test Brand',
              confidence: 0.95,
              category: 'Electronics'
            }
          });
          controller.enqueue(encoder.encode(analysisData + '\n'));

          // Send completion
          const completeData = JSON.stringify({
            type: 'complete',
            result: {
              success: true,
              productId: 'test-product-' + Date.now(),
              message: 'Upload completed successfully!',
              imageUrls: files.map((_, index) => `/uploads/image-${index}.jpg`)
            }
          });
          controller.enqueue(encoder.encode(completeData + '\n'));
          
          controller.close();
        }, 2000);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
    
  } catch (error) {
    console.error('❌ Error in POST route:', error);
    return Response.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
}

export async function GET() {
  console.log('🎯 GET route hit!');
  
  return Response.json({
    success: true,
    message: 'GET route is working! The API endpoint exists.'
  });
}