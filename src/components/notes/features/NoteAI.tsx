import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Sparkles,
  FileText,
  MessageSquare,
  Lightbulb,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Note } from "../types/NoteInterface";
import { supabase } from "../../../../supabase/supabase";
import { toast } from "react-hot-toast";

interface NoteAIProps {
  note: Note;
  onNoteUpdated: (note: Note) => void;
}

type AIFeature =
  | "summarize"
  | "improve"
  | "translate"
  | "sentiment"
  | "keywords"
  | "questions";

interface AIResult {
  type: AIFeature;
  result: string;
  confidence: number;
  timestamp: string;
}

export function NoteAI({ note, onNoteUpdated }: NoteAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AIResult[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<AIFeature | null>(
    null,
  );

  const aiFeatures = [
    {
      id: "summarize" as AIFeature,
      name: "Summarize",
      description: "Generate a concise summary of your note",
      icon: <FileText className="h-4 w-4" />,
      color: "bg-blue-500",
    },
    {
      id: "improve" as AIFeature,
      name: "Improve Writing",
      description: "Enhance grammar, style, and clarity",
      icon: <Sparkles className="h-4 w-4" />,
      color: "bg-purple-500",
    },
    {
      id: "sentiment" as AIFeature,
      name: "Analyze Sentiment",
      description: "Understand the emotional tone of your note",
      icon: <MessageSquare className="h-4 w-4" />,
      color: "bg-green-500",
    },
    {
      id: "keywords" as AIFeature,
      name: "Extract Keywords",
      description: "Identify key topics and themes",
      icon: <Lightbulb className="h-4 w-4" />,
      color: "bg-yellow-500",
    },
    {
      id: "questions" as AIFeature,
      name: "Generate Questions",
      description: "Create discussion questions from content",
      icon: <MessageSquare className="h-4 w-4" />,
      color: "bg-indigo-500",
    },
  ];

  const processWithAI = async (feature: AIFeature) => {
    if (!note.content.trim()) {
      toast.error("Note content is empty");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setSelectedFeature(feature);

    try {
      // Simulate AI processing with progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      let result: string;
      let confidence: number;

      // Mock AI results based on feature type
      switch (feature) {
        case "summarize":
          result = generateSummary(note.content);
          confidence = 0.85;
          break;
        case "improve":
          result = improveWriting(note.content);
          confidence = 0.78;
          break;
        case "sentiment":
          result = analyzeSentiment(note.content);
          confidence = 0.92;
          break;
        case "keywords":
          result = extractKeywords(note.content);
          confidence = 0.88;
          break;
        case "questions":
          result = generateQuestions(note.content);
          confidence = 0.75;
          break;
        default:
          result = "AI processing completed";
          confidence = 0.5;
      }

      const aiResult: AIResult = {
        type: feature,
        result,
        confidence,
        timestamp: new Date().toISOString(),
      };

      setResults((prev) => [aiResult, ...prev]);
      clearInterval(progressInterval);
      setProgress(100);

      // Update note with AI summary if available
      if (feature === "summarize") {
        const updatedNote = {
          ...note,
          ai_summary: result,
        };

        const { error } = await supabase
          .from("notes")
          .update({ ai_summary: result })
          .eq("id", note.id);

        if (!error) {
          onNoteUpdated(updatedNote);
        }
      }

      toast.success(`AI ${feature} completed successfully!`);
    } catch (error) {
      console.error("AI processing error:", error);
      toast.error("AI processing failed");
    } finally {
      setIsProcessing(false);
      setSelectedFeature(null);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  // Mock AI functions (in a real app, these would call actual AI services)
  const generateSummary = (content: string): string => {
    const sentences = content.split(".").filter((s) => s.trim().length > 0);
    const keyPoints = sentences
      .slice(0, 3)
      .map((s) => s.trim())
      .join(". ");
    return `Summary: ${keyPoints}. This note contains ${sentences.length} main points covering the key topics discussed.`;
  };

  const improveWriting = (content: string): string => {
    return `Improved version:\n\n${content}\n\n✨ Suggestions:\n• Consider adding more specific examples\n• Break long paragraphs into shorter ones\n• Use active voice where possible\n• Add transitional phrases for better flow`;
  };

  const analyzeSentiment = (content: string): string => {
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "amazing",
      "wonderful",
      "happy",
      "love",
    ];
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "hate",
      "sad",
      "angry",
      "frustrated",
    ];

    const words = content.toLowerCase().split(/\s+/);
    const positive = words.filter((word) =>
      positiveWords.some((pw) => word.includes(pw)),
    ).length;
    const negative = words.filter((word) =>
      negativeWords.some((nw) => word.includes(nw)),
    ).length;

    let sentiment = "Neutral";
    if (positive > negative) sentiment = "Positive";
    else if (negative > positive) sentiment = "Negative";

    return `Sentiment Analysis: ${sentiment}\n\nPositive indicators: ${positive}\nNegative indicators: ${negative}\n\nOverall tone appears to be ${sentiment.toLowerCase()} with a confidence level of ${Math.random() * 0.3 + 0.7}`;
  };

  const extractKeywords = (content: string): string => {
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
    ]);

    const wordCount = new Map<string, number>();
    words.forEach((word) => {
      const cleaned = word.replace(/[^a-zA-Z]/g, "");
      if (cleaned.length > 3 && !commonWords.has(cleaned)) {
        wordCount.set(cleaned, (wordCount.get(cleaned) || 0) + 1);
      }
    });

    const keywords = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => `${word} (${count})`)
      .join(", ");

    return `Key Topics: ${keywords}\n\nThese keywords represent the main themes and concepts in your note.`;
  };

  const generateQuestions = (content: string): string => {
    const questions = [
      "What are the main takeaways from this content?",
      "How can this information be applied in practice?",
      "What additional research might be needed?",
      "What are the potential implications of these ideas?",
      "How does this relate to other concepts or topics?",
    ];

    return `Discussion Questions:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
  };

  const applyResult = (result: AIResult) => {
    if (result.type === "improve") {
      // Extract improved content (mock implementation)
      const improvedContent =
        result.result.split("Improved version:\n\n")[1]?.split("\n\n✨")[0] ||
        note.content;

      const updatedNote = {
        ...note,
        content: improvedContent,
      };

      supabase
        .from("notes")
        .update({ content: improvedContent })
        .eq("id", note.id)
        .then(({ error }) => {
          if (!error) {
            onNoteUpdated(updatedNote);
            toast.success("Note content updated with AI improvements!");
          }
        });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8)
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (confidence >= 0.6)
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <>
      {note.ai_summary && (
        <Badge variant="secondary" className="mr-2">
          <Brain className="h-3 w-3 mr-1" />
          AI Summary
        </Badge>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Brain className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Assistant
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* AI Features */}
            <div>
              <h3 className="font-semibold mb-3">Available AI Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => processWithAI(feature.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 ${feature.color} text-white rounded`}
                      >
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{feature.name}</h4>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Processing Status */}
            {isProcessing && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-blue-600 animate-pulse" />
                  <span className="font-medium text-blue-800">
                    Processing with AI: {selectedFeature}
                  </span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-blue-600 mt-2">
                  {progress < 30 && "Analyzing content..."}
                  {progress >= 30 && progress < 60 && "Processing with AI..."}
                  {progress >= 60 && progress < 90 && "Generating results..."}
                  {progress >= 90 && "Finalizing..."}
                </p>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">AI Results</h3>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{result.type}</Badge>
                          <div className="flex items-center gap-1">
                            {getConfidenceIcon(result.confidence)}
                            <span
                              className={`text-sm ${getConfidenceColor(result.confidence)}`}
                            >
                              {Math.round(result.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {result.type === "improve" && (
                            <Button
                              size="sm"
                              onClick={() => applyResult(result)}
                            >
                              Apply Changes
                            </Button>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <Textarea
                        value={result.result}
                        readOnly
                        className="min-h-[100px] bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.length === 0 && !isProcessing && (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select an AI feature above to get started</p>
                <p className="text-sm mt-1">
                  AI will analyze your note content and provide insights
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
              <strong>Note:</strong> AI features are simulated in this demo. In
              a production environment, these would connect to actual AI
              services like OpenAI, Google AI, or custom models.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
