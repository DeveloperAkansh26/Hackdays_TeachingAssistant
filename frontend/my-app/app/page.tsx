"use client";

import { useState } from "react";
// Assuming these components are available in your project structure
// Since I cannot provide them, I will use standard HTML elements
// as placeholders where necessary, but keep your original structure.
// import { FileUploadZone } from "@/components/FileUploadZone";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { useToast } from "@/hooks/use-toast";

// Mock components for previewing the structure
const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`bg-white border rounded-lg ${className}`}>{children}</div>
);

const Button = ({ onClick, disabled, className, children }: { onClick: () => void, disabled: boolean, className?: string, children: React.ReactNode }) => (
  <button onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-md ${className} ${disabled ? 'bg-gray-300' : 'bg-blue-600 text-white'}`}>
    {children}
  </button>
);

// Mock FileUploadZone
const FileUploadZone = ({ label, file, onFileChange }: { label: string, file: File | null, onFileChange: (file: File | null) => void }) => (
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
    <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
    <input
      type="file"
      className="block w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0
        file:text-sm file:font-semibold
        file:bg-blue-50 file:text-blue-700
        hover:file:bg-blue-100"
      onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)}
    />
    {file && (
      <p className="mt-2 text-xs text-gray-600">
        Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
      </p>
    )}
  </div>
);

// Mock useToast hook
const useToast = () => {
  return {
    toast: ({ title, description, variant }: { title: string, description: string, variant?: string }) => {
      const color = variant === 'destructive' ? 'red' : 'green';
      console.log(`%c[${title}]`, `color: ${color}; font-weight: bold;`, description);
      // In a real app, you'd use a visual toast component
      // window.alert(`[${title}] ${description}`); // Avoid alert, but for demo...
    }
  };
};

// Lucide-react icons mock
const Loader2 = ({ className }: { className?: string }) => <span className={className}>🔄</span>;
const Send = ({ className }: { className?: string }) => <span className={className}>✉️</span>;
const CheckCircle2 = ({ className }: { className?: string }) => <span className={className}>✅</span>;

/**
 * Utility function to read a file as a Base64 string.
 */
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove the data:mime/type;base64, prefix
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Fetches data with exponential backoff for retries.
 */
const fetchWithBackoff = async (url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      // Don't retry on client errors (4xx), only server errors (5xx) or network issues
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} ${response.statusText}`);
      }
      // Throw an error to be caught by the catch block for retry
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      // console.log(`Retrying... attempts left: ${retries}. Waiting ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      // Recursively call with one less retry and doubled delay
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    } else {
      // No retries left, re-throw the last error
      throw error;
    }
  }
};

const Index = () => {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string>("");
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!file1 || !file2) {
      toast({
        title: "Missing files",
        description: "Please upload both files before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setResult("");

    try {
      // 1. Read files as base64
      const [file1Base64, file2Base64] = await Promise.all([
        readFileAsBase64(file1),
        readFileAsBase64(file2)
      ]);

      // 2. Set up API call
      const apiKey = ""; // API key is handled by the environment
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

      // 3. Construct the payload for the Gemini API
      const payload = {
        contents: [{
          parts: [
            { text: `You are an expert academic evaluator and grading assistant. Your task is to meticulously evaluate a student's submission against a provided assignment (question paper) and assign a total score out of 100.

You must be objective, fair, and base your entire evaluation only on the content provided in the two inputs.

INPUTS

1. Assignment Questions:
${file1.name}


2. Student's Submission:
${file2.name}


TASK & EVALUATION CRITERIA

Analyze: Read and understand every question in the "Assignment Questions" input. Note the requirements for each (e.g., "explain," "calculate," "list," "compare and contrast").

Compare: For each question, locate and analyze the corresponding answer in the "Student's Submission."

Evaluate: Assess the student's answer for each question based on the following criteria:

Accuracy: Is the information correct and factual?

Completeness: Does the answer address all parts of the question?

Clarity: Is the answer well-written, easy to understand, and logically structured?

Depth of Understanding: Does the answer demonstrate a superficial or a deep understanding of the topic?

Adherence to Instructions: Did the student follow all specific instructions (e.g., show work, use examples, word count)?

Score:

If a marking scheme (e.g., "10 marks for Q1") is provided in the assignment, use it as the basis for your scoring.

If no scheme is provided, you must logically distribute the 100 total points across all questions based on their complexity and perceived weight (e.g., a 5-part essay question is worth more than a simple "define" question). Clearly state the maximum points you have assigned to each question in your breakdown.

Assign a score to the student's answer for each question.

REQUIRED OUTPUT FORMAT

You MUST provide your evaluation in the following strict format. Do not use any other format.

Overall Score: [Total Score]/100

General Feedback & Summary:
[Provide a brief, 2-3 sentence summary of the student's overall performance, highlighting one major strength and one primary area for improvement.]

Detailed Breakdown:

Question 1: [Student's Score for Q1] / [Max Points for Q1]

Feedback: [Provide a 1-2 sentence justification for the score. Example: "The student correctly identified all three concepts but the explanation for the second concept was incomplete."]

Question 2: [Student's Score for Q2] / [Max Points for Q2]

Feedback: [Provide a 1-2 sentence justification for the score. Example: "Excellent, thorough analysis. The answer was well-structured and used supporting examples as requested."]

Question 3: [Student's Score for Q3] / [Max Points for Q3]

Feedback: [Provide a 1-2 sentence justification for the score. Example: "The final calculation was incorrect due to an error in step 2. The initial setup was correct."]

(Continue this format for all questions in the assignment)`},
            {
              inlineData: {
                mimeType: file1.type,
                data: file1Base64
              }
            },
            {
              inlineData: {
                mimeType: file2.type,
                data: file2Base64
              }
            }
          ]
        }]
      };

      // 4. Make the API call with exponential backoff
      const geminiResponse = await fetchWithBackoff(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const geminiData = await geminiResponse.json();

      // 5. Extract the result text
      const finalResult = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (finalResult) {
        setResult(finalResult);
        toast({
          title: "Success!",
          description: "Files processed successfully.",
        });
      } else {
        // Handle cases where the API returns a non-error but no text
        throw new Error("No content received from API. Check response structure.");
      }

    } catch (error: any) {
      console.error("Failed to process files:", error);
      toast({
        title: "Error",
        description: `Failed to process files: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <Send className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Assignment Evaluation Tool
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Upload the Question Paper and Student Submission files to evaluate the assignment automatically using AI.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="p-8 mb-6 shadow-xl border-gray-200/50 backdrop-blur-sm">
          <div className="space-y-6">
            <FileUploadZone
              label="Question Paper"
              file={file1}
              onFileChange={setFile1}
            />
            
            <FileUploadZone
              label="Student Submission"
              file={file2}
              onFileChange={setFile2}
            />

            <Button
              onClick={handleSubmit}
              disabled={!file1 || !file2 || isProcessing}
              className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 transition-all shadow-lg text-white"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Files...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Send className="mr-2 h-5 w-5" />
                  Process Files
                </div>
              )}
            </Button>
          </div>
        </Card>

        {/* Result Section */}
        {(result || isProcessing) && (
          <Card className="p-8 shadow-xl border-gray-200/50 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {isProcessing ? (
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                )}
                <h2 className="text-xl font-semibold text-gray-900">
                  {isProcessing ? "Processing..." : "Result"}
                </h2>
              </div>

              {result && (
                <div className="bg-gray-100/50 rounded-lg p-6 border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {result}
                  </pre>
                </div>
              )}

              {isProcessing && (
                <div className="space-y-3 pt-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 animate-pulse" style={{ width: "60%", animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      Analyzing...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
      {/* Basic CSS for animations if Tailwind JIT isn't configured for 'animate-in' */}
      <style>{`
        @keyframes pulse {
          50% { opacity: .5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Index;