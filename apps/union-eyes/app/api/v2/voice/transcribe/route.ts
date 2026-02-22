// @ts-nocheck
/**
 * POST /api/voice/transcribe
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { transcribeAudioWithLanguage, type SupportedLanguage } from "@/lib/azure-speech";
import { withApi, ApiError } from '@/lib/api/framework';

export const POST = withApi(
  {
    auth: { required: true, minRole: 'delegate' as const },
    openapi: {
      tags: ['Voice'],
      summary: 'POST transcribe',
    },
    successStatus: 201,
  },
  async ({ request, userId, organizationId, user, body, query }) => {

          // Authenticate user
          // Parse form data
          const formData = await request.formData();
          const audioFile = formData.get("audio") as File;
          const language = (formData.get("language") as SupportedLanguage) || "en-CA";
          if (!audioFile) {
            return standardErrorResponse(ErrorCode.VALIDATION_ERROR);
          }
          // Validate file type
          const validTypes = ["audio/wav", "audio/webm", "audio/ogg", "audio/mp3", "audio/mpeg"];
          if (!validTypes.includes(audioFile.type)) {
            return standardErrorResponse(ErrorCode.VALIDATION_ERROR);
          }
          // Validate file size (max 25MB)
          const maxSize = 25 * 1024 * 1024;
          if (audioFile.size > maxSize) {
            return standardErrorResponse(ErrorCode.VALIDATION_ERROR);
          }
          // Convert file to buffer
          const arrayBuffer = await audioFile.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          // Transcribe audio
          const text = await transcribeAudioWithLanguage(buffer, language);
          if (!text || text.trim().length === 0) {
            return standardErrorResponse(ErrorCode.VALIDATION_ERROR);
          }
          return NextResponse.json({
            text: text.trim(),
            language,
            duration: audioFile.size, // Approximate
            success: true,
          });
  },
);
