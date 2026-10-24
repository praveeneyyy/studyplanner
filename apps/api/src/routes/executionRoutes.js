import { Router } from 'express';
import { executeStudentCode, stopStudentExecution, LANGUAGE_CONFIG } from '../services/codeExecutionService.js';
import { AIService } from '../services/aiService.js';

const router = Router();

// Run student code
router.post('/run', async (req, res, next) => {
  try {
    const { language, code, stdin, timeoutMs } = req.body;

    if (!language || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: "language" and "code" string are required.'
      });
    }

    const result = await executeStudentCode({
      language,
      code,
      stdin: stdin || '',
      timeoutMs: timeoutMs ? Math.min(Number(timeoutMs), 15000) : 8000
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Stop running execution
router.post('/:id/stop', (req, res) => {
  const stopped = stopStudentExecution(req.params.id);
  res.json({ success: true, stopped });
});

// Get supported runtimes status
router.get('/runtimes', async (req, res) => {
  const list = Object.entries(LANGUAGE_CONFIG).map(([key, val]) => ({
    id: key,
    name: val.name,
    extension: val.extension,
    runtime: val.runtime,
    isClientOnly: Boolean(val.inBrowser),
    isInMemory: Boolean(val.inMemory)
  }));

  res.json({ success: true, runtimes: list });
});

// Contextual AI Coding Agent endpoint
router.post('/ai-assist', async (req, res, next) => {
  try {
    const {
      language = 'python',
      code = '',
      selectedCode = '',
      errorDiagnostic = null,
      output = '',
      prompt = '',
      actionType = 'explain' // 'explain' | 'fix' | 'debug' | 'generate' | 'improve' | 'testcase'
    } = req.body;

    // Build structured developer prompt
    let systemPrompt = `You are a Principal Software Architect and empathetic Student Coding Mentor.
Your role is to help students learn to write, understand, debug, and improve code.
Active Language: ${language}
`;

    let userPrompt = '';

    if (actionType === 'fix') {
      userPrompt = `The following ${language} program encountered an error.
Error Diagnostic:
${JSON.stringify(errorDiagnostic, null, 2)}

Program Output / Stderr:
${output}

Source Code:
\`\`\`${language}
${code}
\`\`\`

User Question / Context: ${prompt || 'Please fix this error.'}

Provide your response with:
1. **Root Cause**: Explain in 1-2 plain sentences why this error happened.
2. **The Fix**: Explain what needs to change and why.
3. **Corrected Code**: Provide the full corrected code in a \`\`\`${language} block.
4. **Verification**: How can the student verify the solution works?
`;
    } else if (actionType === 'explain') {
      userPrompt = `Explain the following ${language} code for a student:
${selectedCode ? `Selected lines to focus on:\n\`\`\`${language}\n${selectedCode}\n\`\`\`\nFull context:` : ''}
\`\`\`${language}
${code}
\`\`\`

User Request: ${prompt || 'Explain how this code works step by step, its time and space complexity, and any key concepts.'}
`;
    } else if (actionType === 'debug' || actionType === 'find_bugs') {
      userPrompt = `Analyze the following ${language} code for potential bugs, off-by-one errors, edge cases (e.g. empty inputs, nulls, negative numbers), and memory leaks:
\`\`\`${language}
${code}
\`\`\`

User Request: ${prompt || 'Find all potential bugs and edge case vulnerabilities in this code.'}
`;
    } else if (actionType === 'testcase') {
      userPrompt = `Generate comprehensive test cases for the following ${language} code, including standard cases, boundary conditions, and edge cases:
\`\`\`${language}
${code}
\`\`\`

User Request: ${prompt || 'Generate 4-5 test cases with input values, expected outputs, and explanations.'}
`;
    } else if (actionType === 'improve') {
      userPrompt = `Suggest clean code, readability, and performance improvements for this ${language} program without changing its intended behavior:
\`\`\`${language}
${code}
\`\`\`

User Request: ${prompt || 'How can I make this code cleaner, more idiomatic, and more performant?'}
`;
    } else {
      userPrompt = `Here is the student's current ${language} code:
\`\`\`${language}
${code}
\`\`\`
${output ? `Recent execution output:\n${output}\n` : ''}

Student question: ${prompt}
`;
    }

    // Call unified AIService
    const aiResult = await AIService.generateResponse({
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      formatType: 'DETAILED'
    });

    res.json({
      success: true,
      answer: aiResult.text || aiResult.content || 'Analysis complete.',
      actionType
    });
  } catch (err) {
    next(err);
  }
});

export default router;
