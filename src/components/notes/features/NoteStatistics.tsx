import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  FileText,
  Tag,
  Calendar,
  Clock,
  Target,
  Award,
  Activity,
} from "lucide-react";
import { Note } from "../types/NoteInterface";
import { calculateWordCount, calculateReadingTime } from "../utils/NoteUtils";

interface NoteStatisticsProps {
  notes: Note[];
  darkMode?: boolean;
}

interface Statistics {
  totalNotes: number;
  totalWords: number;
  totalReadingTime: number;
  averageWordsPerNote: number;
  notesThisWeek: number;
  notesThisMonth: number;
  mostUsedTags: { tag: string; count: number }[];
  categoriesBreakdown: { category: string; count: number }[];
  priorityBreakdown: { priority: string; count: number }[];
  productivityScore: number;
  longestNote: Note | null;
  shortestNote: Note | null;
  oldestNote: Note | null;
  newestNote: Note | null;
  dailyActivity: { date: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
}

export function NoteStatistics({
  notes,
  darkMode = false,
}: NoteStatisticsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statistics = useMemo((): Statistics => {
    if (notes.length === 0) {
      return {
        totalNotes: 0,
        totalWords: 0,
        totalReadingTime: 0,
        averageWordsPerNote: 0,
        notesThisWeek: 0,
        notesThisMonth: 0,
        mostUsedTags: [],
        categoriesBreakdown: [],
        priorityBreakdown: [],
        productivityScore: 0,
        longestNote: null,
        shortestNote: null,
        oldestNote: null,
        newestNote: null,
        dailyActivity: [],
        monthlyTrend: [],
      };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

    // Basic counts
    const totalNotes = notes.length;
    const notesThisWeek = notes.filter(
      (note) => new Date(note.created_at) >= weekAgo,
    ).length;
    const notesThisMonth = notes.filter(
      (note) => new Date(note.created_at) >= monthAgo,
    ).length;

    // Word and reading time calculations
    const wordCounts = notes.map((note) => calculateWordCount(note.content));
    const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
    const totalReadingTime = notes.reduce(
      (sum, note) => sum + calculateReadingTime(note.content),
      0,
    );
    const averageWordsPerNote = totalWords / totalNotes;

    // Tag analysis
    const tagCounts = new Map<string, number>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    const mostUsedTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Category breakdown
    const categoryCounts = new Map<string, number>();
    notes.forEach((note) => {
      const category = note.category || "Uncategorized";
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });
    const categoriesBreakdown = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Priority breakdown
    const priorityCounts = new Map<string, number>();
    notes.forEach((note) => {
      const priority = note.priority || "low";
      priorityCounts.set(priority, (priorityCounts.get(priority) || 0) + 1);
    });
    const priorityBreakdown = Array.from(priorityCounts.entries())
      .map(([priority, count]) => ({ priority, count }))
      .sort((a, b) => {
        const order = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (
          (order[b.priority as keyof typeof order] || 0) -
          (order[a.priority as keyof typeof order] || 0)
        );
      });

    // Find extreme notes
    const sortedByLength = [...notes].sort(
      (a, b) => calculateWordCount(b.content) - calculateWordCount(a.content),
    );
    const longestNote = sortedByLength[0] || null;
    const shortestNote = sortedByLength[sortedByLength.length - 1] || null;

    const sortedByDate = [...notes].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const oldestNote = sortedByDate[0] || null;
    const newestNote = sortedByDate[sortedByDate.length - 1] || null;

    // Daily activity (last 30 days)
    const dailyActivity: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const count = notes.filter((note) => {
        const noteDate = new Date(note.created_at).toISOString().split("T")[0];
        return noteDate === dateStr;
      }).length;
      dailyActivity.push({ date: dateStr, count });
    }

    // Monthly trend (last 12 months)
    const monthlyTrend: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const count = notes.filter((note) => {
        const noteDate = new Date(note.created_at);
        return (
          noteDate.getFullYear() === date.getFullYear() &&
          noteDate.getMonth() === date.getMonth()
        );
      }).length;
      monthlyTrend.push({ month: monthStr, count });
    }

    // Productivity score (0-100)
    const baseScore = Math.min(totalNotes * 2, 50); // Up to 50 points for note count
    const consistencyScore = Math.min(notesThisWeek * 5, 25); // Up to 25 points for weekly activity
    const qualityScore = Math.min(averageWordsPerNote / 10, 25); // Up to 25 points for note quality
    const productivityScore = Math.round(
      baseScore + consistencyScore + qualityScore,
    );

    return {
      totalNotes,
      totalWords,
      totalReadingTime,
      averageWordsPerNote,
      notesThisWeek,
      notesThisMonth,
      mostUsedTags,
      categoriesBreakdown,
      priorityBreakdown,
      productivityScore,
      longestNote,
      shortestNote,
      oldestNote,
      newestNote,
      dailyActivity,
      monthlyTrend,
    };
  }, [notes]);

  const getProductivityLevel = (
    score: number,
  ): { level: string; color: string } => {
    if (score >= 80) return { level: "Excellent", color: "text-green-600" };
    if (score >= 60) return { level: "Good", color: "text-blue-600" };
    if (score >= 40) return { level: "Average", color: "text-yellow-600" };
    if (score >= 20)
      return { level: "Below Average", color: "text-orange-600" };
    return { level: "Needs Improvement", color: "text-red-600" };
  };

  const productivity = getProductivityLevel(statistics.productivityScore);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 mr-2" />
          Statistics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Note Statistics & Analytics</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.totalNotes}
                </div>
                <p className="text-xs text-gray-500">
                  {statistics.notesThisMonth} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Total Words
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.totalWords.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">
                  ~{Math.round(statistics.averageWordsPerNote)} avg per note
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Reading Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.totalReadingTime}m
                </div>
                <p className="text-xs text-gray-500">Total estimated time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.notesThisWeek}
                </div>
                <p className="text-xs text-gray-500">Notes created</p>
              </CardContent>
            </Card>
          </div>

          {/* Productivity Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Productivity Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Overall Score</span>
                    <span
                      className={`text-sm font-medium ${productivity.color}`}
                    >
                      {productivity.level}
                    </span>
                  </div>
                  <Progress
                    value={statistics.productivityScore}
                    className="h-3"
                  />
                </div>
                <div className="text-3xl font-bold">
                  {statistics.productivityScore}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Based on note count, consistency, and average note quality
              </p>
            </CardContent>
          </Card>

          {/* Tags and Categories */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Most Used Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statistics.mostUsedTags.length > 0 ? (
                  <div className="space-y-2">
                    {statistics.mostUsedTags.slice(0, 5).map((item) => (
                      <div
                        key={item.tag}
                        className="flex items-center justify-between"
                      >
                        <Badge variant="secondary">{item.tag}</Badge>
                        <span className="text-sm text-gray-500">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No tags used yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statistics.categoriesBreakdown.length > 0 ? (
                  <div className="space-y-2">
                    {statistics.categoriesBreakdown.slice(0, 5).map((item) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(item.count / statistics.totalNotes) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-8 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No categories assigned
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Priority Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statistics.priorityBreakdown.map((item) => {
                  const colors = {
                    urgent: "bg-red-500",
                    high: "bg-orange-500",
                    medium: "bg-yellow-500",
                    low: "bg-green-500",
                  };
                  const color =
                    colors[item.priority as keyof typeof colors] ||
                    "bg-gray-500";

                  return (
                    <div key={item.priority} className="text-center">
                      <div
                        className={`w-12 h-12 ${color} rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold`}
                      >
                        {item.count}
                      </div>
                      <p className="text-sm font-medium capitalize">
                        {item.priority}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round((item.count / statistics.totalNotes) * 100)}
                        %
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Notable Notes */}
          {(statistics.longestNote || statistics.oldestNote) && (
            <Card>
              <CardHeader>
                <CardTitle>Notable Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {statistics.longestNote && (
                    <div className="p-3 bg-blue-50 rounded">
                      <h4 className="font-medium text-blue-800 mb-1">
                        Longest Note
                      </h4>
                      <p className="text-sm font-medium">
                        {statistics.longestNote.title}
                      </p>
                      <p className="text-xs text-blue-600">
                        {calculateWordCount(statistics.longestNote.content)}{" "}
                        words
                      </p>
                    </div>
                  )}

                  {statistics.oldestNote && (
                    <div className="p-3 bg-green-50 rounded">
                      <h4 className="font-medium text-green-800 mb-1">
                        Oldest Note
                      </h4>
                      <p className="text-sm font-medium">
                        {statistics.oldestNote.title}
                      </p>
                      <p className="text-xs text-green-600">
                        {new Date(
                          statistics.oldestNote.created_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Activity (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-20">
                {statistics.dailyActivity.map((day, index) => {
                  const maxCount = Math.max(
                    ...statistics.dailyActivity.map((d) => d.count),
                  );
                  const height =
                    maxCount > 0 ? (day.count / maxCount) * 100 : 0;

                  return (
                    <div
                      key={index}
                      className="flex-1 bg-blue-200 hover:bg-blue-300 transition-colors rounded-t"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${day.date}: ${day.count} notes`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Hover over bars to see details
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
