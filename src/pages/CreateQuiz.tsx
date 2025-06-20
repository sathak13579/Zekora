import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSupabase } from "../lib/supabase-provider";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { Accordion } from "../components/ui/Accordion";
import {
  generateQuestionsFromText,
  extractTranscriptFromVideoUrl,
} from "../lib/utils";

type QuizData = {
  id?: string;
  title: string;
  description: string;
  questions: QuestionData[];
  has_timer: boolean;
  question_timer_seconds: number;
};

type QuestionData = {
  id?: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  order: number;
};

const CreateQuiz = () => {
  const [searchParams] = useSearchParams();
  const editQuizId = searchParams.get("edit");
  const isEditMode = !!editQuizId;

  const { supabase, user } = useSupabase();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState<QuizData>({
    title: "",
    description: "",
    questions: [],
    has_timer: false,
    question_timer_seconds: 20,
  });
  const [inputText, setInputText] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [inputMethod, setInputMethod] = useState<"text" | "file" | "video">(
    "text"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuizData = async () => {
      if (!isEditMode || !user) return;

      try {
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", editQuizId)
          .eq("user_id", user.id)
          .single();

        if (quizError) throw quizError;

        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", editQuizId)
          .order("order");

        if (questionsError) throw questionsError;

        setQuizData({
          id: quizData.id,
          title: quizData.title,
          description: quizData.description || "",
          has_timer: quizData.has_timer || false,
          question_timer_seconds: quizData.question_timer_seconds || 20,
          questions: questionsData.map((q) => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options as string[],
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            order: q.order,
          })),
        });
      } catch (err: any) {
        console.error("Error loading quiz:", err);
        setError(err.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();

    // Cleanup: reset quizData when leaving edit mode or switching quizzes
  }, [supabase, user, editQuizId, isEditMode]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setFileContent(content);
      handleGenerateQuestions(content);
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
  });

  const handleGenerateQuestions = async (content?: string) => {
    let contentToProcess = content || "";

    if (!content) {
      if (inputMethod === "text") {
        contentToProcess = inputText;
      } else if (inputMethod === "file") {
        contentToProcess = fileContent;
      } else if (inputMethod === "video") {
        if (!videoUrl.trim()) {
          setError("Please provide a video URL");
          return;
        }

        setIsGenerating(true);
        setError(null);

        try {
          // Extract transcript from video URL
          contentToProcess = await extractTranscriptFromVideoUrl(videoUrl);
          toast.success("Video transcript extracted successfully!");
        } catch (err: any) {
          console.error("Error extracting video transcript:", err);
          toast.error(err.message || "Failed to extract video transcript");
          setIsGenerating(false);
          return;
        }
      }
    }

    if (!contentToProcess.trim()) {
      setError("Please provide content to generate questions");
      setIsGenerating(false);
      return;
    }

    if (!isGenerating) {
      setIsGenerating(true);
      setError(null);
    }

    try {
      const generatedQuestions = await generateQuestionsFromText(
        contentToProcess
      );

      setQuizData((prev) => ({
        ...prev,
        questions: [...prev.questions, ...generatedQuestions],
      }));

      setInputText("");
      setFileContent("");
      setVideoUrl("");

      toast.success("Questions generated successfully!");
    } catch (err: any) {
      console.error("Error generating questions:", err);
      toast.error(err.message || "Failed to generate questions");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateQuestion = (
    index: number,
    field: keyof QuestionData,
    value: any
  ) => {
    setQuizData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: value,
      };
      return { ...prev, questions: updatedQuestions };
    });
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    setQuizData((prev) => {
      const updatedQuestions = [...prev.questions];
      const options = [...updatedQuestions[questionIndex].options];
      options[optionIndex] = value;
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        options,
      };
      return { ...prev, questions: updatedQuestions };
    });
  };

  const addQuestion = () => {
    const newOrder = quizData.questions.length;
    setQuizData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question_text: "",
          options: ["", "", "", ""],
          correct_answer: "",
          explanation: "",
          order: newOrder,
        },
      ],
    }));
  };

  const removeQuestion = (index: number) => {
    setQuizData((prev) => {
      const updatedQuestions = prev.questions.filter((_, i) => i !== index);
      return {
        ...prev,
        questions: updatedQuestions.map((q, i) => ({ ...q, order: i })),
      };
    });
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === quizData.questions.length - 1)
    ) {
      return;
    }

    setQuizData((prev) => {
      const updatedQuestions = [...prev.questions];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      [updatedQuestions[index], updatedQuestions[targetIndex]] = [
        updatedQuestions[targetIndex],
        updatedQuestions[index],
      ];

      return {
        ...prev,
        questions: updatedQuestions.map((q, i) => ({ ...q, order: i })),
      };
    });
  };

  const saveQuiz = async () => {
    if (!user) return;

    if (!quizData.title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    if (quizData.questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    const incompleteQuestion = quizData.questions.find(
      (q) =>
        !q.question_text.trim() ||
        !q.correct_answer.trim() ||
        q.options.some((o) => !o.trim())
    );

    if (incompleteQuestion) {
      toast.error(
        "Please complete all questions, options, and correct answers"
      );
      return;
    }

    setIsSaving(true);

    // Remove duplicate questions by question_text and options
    const uniqueQuestions = quizData.questions.filter(
      (q, idx, arr) =>
        arr.findIndex(
          (x) =>
            x.question_text === q.question_text &&
            JSON.stringify(x.options) === JSON.stringify(q.options)
        ) === idx
    );

    try {
      if (isEditMode && quizData.id) {
        const { error: quizError } = await supabase
          .from("quizzes")
          .update({
            title: quizData.title,
            description: quizData.description,
            has_timer: quizData.has_timer,
            question_timer_seconds: quizData.question_timer_seconds,
            status: "ready",
          })
          .eq("id", quizData.id);

        if (quizError) throw quizError;

        // Fetch existing questions to compare
        const { data: existingQuestions, error: fetchError } = await supabase
          .from("questions")
          .select("id")
          .eq("quiz_id", quizData.id);
        if (fetchError) throw fetchError;

        // Get IDs of questions currently in UI
        const currentIds = uniqueQuestions.filter((q) => q.id).map((q) => q.id);
        // Find IDs to delete
        const idsToDelete = existingQuestions
          .filter((q) => !currentIds.includes(q.id))
          .map((q) => q.id);
        // Delete those questions
        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("questions")
            .delete()
            .in("id", idsToDelete);
          if (deleteError) throw deleteError;
        }

        // Update existing questions and insert new ones
        const updates = uniqueQuestions.map((q) => {
          if (q.id) {
            return supabase
              .from("questions")
              .update({
                question_text: q.question_text,
                options: q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                order: q.order,
              })
              .eq("id", q.id);
          } else {
            return supabase.from("questions").insert({
              quiz_id: quizData.id,
              question_text: q.question_text,
              options: q.options,
              correct_answer: q.correct_answer,
              explanation: q.explanation,
              order: q.order,
            });
          }
        });

        await Promise.all(updates);
        toast.success("Quiz updated successfully!");
      } else {
        const { data: newQuiz, error: quizError } = await supabase
          .from("quizzes")
          .insert({
            title: quizData.title,
            description: quizData.description,
            has_timer: quizData.has_timer,
            question_timer_seconds: quizData.question_timer_seconds,
            user_id: user.id,
            status: "ready",
            player_limit: 20,
          })
          .select()
          .single();

        if (quizError) throw quizError;

        const { error: questionsError } = await supabase
          .from("questions")
          .insert(
            uniqueQuestions.map((q) => ({
              quiz_id: newQuiz.id,
              question_text: q.question_text,
              options: q.options,
              correct_answer: q.correct_answer,
              explanation: q.explanation,
              order: q.order,
            }))
          );

        if (questionsError) throw questionsError;

        toast.success("Quiz created successfully!");
      }

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error saving quiz:", err);
      toast.error(err.message || "Failed to save quiz");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="mb-4 inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? "Edit Quiz" : "Create New Quiz"}
        </h1>
        <p className="mt-1 text-gray-600">
          {isEditMode
            ? "Update your quiz questions and settings"
            : "Create a new quiz with AI-generated questions"}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Quiz Details</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Quiz Title*
            </label>
            <input
              type="text"
              id="title"
              value={quizData.title}
              onChange={(e) =>
                setQuizData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue sm:text-sm"
              placeholder="Enter quiz title"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              rows={3}
              value={quizData.description}
              onChange={(e) =>
                setQuizData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue sm:text-sm"
              placeholder="Describe what this quiz is about"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasTimer"
                checked={quizData.has_timer}
                onChange={(e) =>
                  setQuizData((prev) => ({
                    ...prev,
                    has_timer: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
              />
              <label
                htmlFor="hasTimer"
                className="ml-2 block text-sm font-medium text-gray-700"
              >
                Enable timer for questions
              </label>
            </div>

            {quizData.has_timer && (
              <div className="ml-6">
                <label
                  htmlFor="timerSeconds"
                  className="block text-sm font-medium text-gray-700"
                >
                  Seconds per question
                </label>
                <input
                  type="number"
                  id="timerSeconds"
                  min={5}
                  max={300}
                  value={quizData.question_timer_seconds}
                  onChange={(e) =>
                    setQuizData((prev) => ({
                      ...prev,
                      question_timer_seconds: Math.max(
                        5,
                        Math.min(300, parseInt(e.target.value) || 20)
                      ),
                    }))
                  }
                  className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Choose between 5 and 300 seconds (5 minutes)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isEditMode && (
        <div className="mb-8">
          <Accordion
            title="Generate Questions"
            defaultOpen={true}
            className="bg-white shadow-sm"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Add content to generate questions automatically, or add
                questions manually
              </p>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setInputMethod("text")}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    inputMethod === "text"
                      ? "bg-brand-blue text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Text
                </button>
                {/* <button
                  type="button"
                  onClick={() => setInputMethod("file")}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    inputMethod === "file"
                      ? "bg-brand-blue text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  PDF/Document
                </button> */}
                <button
                  type="button"
                  onClick={() => setInputMethod("video")}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    inputMethod === "video"
                      ? "bg-brand-blue text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Video URL
                </button>
              </div>

              {inputMethod === "text" && (
                <div>
                  <textarea
                    rows={6}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue sm:text-sm"
                    placeholder="Paste article, lecture notes, or any text content here..."
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateQuestions()}
                    disabled={isGenerating || !inputText.trim()}
                    className="mt-4 inline-flex items-center rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Questions"
                    )}
                  </button>
                </div>
              )}

              {inputMethod === "file" && (
                <div
                  {...getRootProps()}
                  className={`mt-1 flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 p-6 ${
                    isDragActive ? "border-brand-blue bg-brand-blue/5" : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      {fileContent
                        ? "File uploaded! Drop another file to replace, or click to browse."
                        : "Drag and drop a PDF or document, or click to browse"}
                    </p>
                    {fileContent && (
                      <p className="mt-2 text-xs text-green-600">
                        File content loaded successfully!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {inputMethod === "video" && (
                <div>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue sm:text-sm"
                    placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    We'll extract captions from the YouTube video to generate
                    questions
                  </p>
                  <button
                    type="button"
                    onClick={() => handleGenerateQuestions()}
                    disabled={isGenerating || !videoUrl.trim()}
                    className="mt-4 inline-flex items-center rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting & Generating...
                      </>
                    ) : (
                      "Generate Questions from Video"
                    )}
                  </button>
                </div>
              )}
            </div>
          </Accordion>
        </div>
      )}

      <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Questions ({quizData.questions.length})
          </h2>
        </div>

        {quizData.questions.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-600">
              No questions yet. Generate questions from content or add them
              manually.
            </p>
            <button
              type="button"
              onClick={addQuestion}
              className="mt-4 inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Question
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {quizData.questions.map((question, qIndex) => (
                <Accordion
                  key={qIndex}
                  title={`Question ${qIndex + 1}`}
                  defaultOpen={qIndex === quizData.questions.length - 1}
                  className="border-gray-200 bg-gray-50"
                >
                  <div className="space-y-4">
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => moveQuestion(qIndex, "up")}
                        disabled={qIndex === 0}
                        className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(qIndex, "down")}
                        disabled={qIndex === quizData.questions.length - 1}
                        className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="rounded p-1 text-red-500 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div>
                      <label
                        htmlFor={`question-${qIndex}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Question Text
                      </label>
                      <input
                        type="text"
                        id={`question-${qIndex}`}
                        value={question.question_text}
                        onChange={(e) =>
                          updateQuestion(
                            qIndex,
                            "question_text",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Options
                      </label>
                      <div className="mt-1 space-y-2">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center">
                            <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                              {String.fromCharCode(65 + oIndex)}
                            </span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) =>
                                updateOption(qIndex, oIndex, e.target.value)
                              }
                              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue sm:text-sm"
                            />
                            <div className="ml-2">
                              <input
                                type="radio"
                                id={`correct-${qIndex}-${oIndex}`}
                                name={`correct-${qIndex}`}
                                checked={question.correct_answer === option}
                                onChange={() =>
                                  updateQuestion(
                                    qIndex,
                                    "correct_answer",
                                    option
                                  )
                                }
                                className="h-4 w-4 border-gray-300 text-brand-blue focus:ring-brand-blue"
                              />
                              <label
                                htmlFor={`correct-${qIndex}-${oIndex}`}
                                className="ml-1 text-xs text-gray-700"
                              >
                                Correct
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`explanation-${qIndex}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Explanation
                      </label>
                      <textarea
                        id={`explanation-${qIndex}`}
                        rows={2}
                        value={question.explanation}
                        onChange={(e) =>
                          updateQuestion(qIndex, "explanation", e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue sm:text-sm"
                        placeholder="Explain why the correct answer is right"
                      />
                    </div>
                  </div>
                </Accordion>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Question
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-4">
        {/* Cancel Button */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          disabled={isSaving}
          className="inline-flex items-center rounded-md bg-gray-100 px-6 py-3 text-base font-medium text-gray-700 shadow-md transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={saveQuiz}
          disabled={isSaving}
          className="inline-flex items-center rounded-md bg-brand-blue px-6 py-3 text-base font-medium text-white shadow-md transition-colors hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Save Quiz
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateQuiz;
