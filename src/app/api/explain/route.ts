import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/ai/client';
import { buildExplanationPrompt } from '@/lib/ai/prompts';
import { getQuestionById, updateQuestionExplanation } from '@/lib/db/queries/questions';

export async function POST(req: NextRequest) {
  const { questionId } = await req.json();
  if (!questionId) {
    return NextResponse.json({ error: 'questionId required' }, { status: 400 });
  }

  const question = await getQuestionById(questionId);
  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  // Return cached explanation if available
  if (question.explanation) {
    return NextResponse.json({ explanation: question.explanation });
  }

  const prompt = buildExplanationPrompt(question);
  let fullText = '';

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        });

        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const text = chunk.delta.text;
            fullText += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }

        // Cache the explanation
        await updateQuestionExplanation(questionId, fullText);
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
