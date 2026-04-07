import type { Classroom, StudentRecord } from "@shared/schema";

const lowerGrades = ["Pre-Primary", "1", "2", "3", "4", "5", "6", "7", "8"];
const seniorGrades = ["9", "10", "11", "12"];

function classIdFor(grade: string, section: string) {
  return grade === "Pre-Primary" ? `preprimary${section.toLowerCase()}` : `${grade}${section.toLowerCase()}`;
}

function trendFor(gradeIndex: number, sectionIndex: number) {
  const base = 82 + Math.min(8, gradeIndex + sectionIndex);
  return [base, base + 1, base + 2, base + 2, base + 3, base + 2, base + 3].map((value) =>
    Math.max(0, Math.min(100, value)),
  );
}

export const seedClasses: Classroom[] = [
  ...lowerGrades.flatMap((grade, gradeIndex) =>
    ["A", "B"].map((section, sectionIndex) => ({
      id: classIdFor(grade, section),
      name: grade === "Pre-Primary" ? `Pre-Primary ${section}` : `${grade} ${section}`,
      grade,
      section,
      termDelta: sectionIndex - 1,
      trend: trendFor(gradeIndex, sectionIndex),
    })),
  ),
  ...seniorGrades.flatMap((grade, gradeIndex) =>
    ["A", "B", "C"].map((section, sectionIndex) => ({
      id: classIdFor(grade, section),
      name: `${grade} ${section}`,
      grade,
      section,
      termDelta: sectionIndex - 1,
      trend: trendFor(gradeIndex + lowerGrades.length, sectionIndex),
    })),
  ),
];

export const seedStudents: StudentRecord[] = [
  { id: "st-003", name: "Tanya Joseph", classId: "5a", rollNo: 3, section: "A", attendance: 96, overall: 90, subjectScores: { Math: 91, Science: 87, English: 92, Social: 86, Computer: 89 }, last7: [87, 88, 88, 89, 90, 90, 90], status: "P", note: "Reads well and supports classmates during activities." },
  { id: "st-007", name: "Zara Khan", classId: "7b", rollNo: 7, section: "B", attendance: 82, overall: 68, subjectScores: { Math: 61, Science: 64, English: 73, Social: 66, Computer: 76 }, last7: [74, 72, 71, 70, 69, 68, 68], status: "L", note: "Late arrival trend in the last 2 weeks." },
  { id: "st-011", name: "Ishaan Roy", classId: "10a", rollNo: 11, section: "A", attendance: 97, overall: 88, subjectScores: { Math: 91, Science: 86, English: 84, Social: 87, Computer: 92 }, last7: [82, 83, 84, 85, 86, 87, 88], status: "P", note: "Ready for stretch assignments." },
  { id: "st-014", name: "Reyansh Verma", classId: "7b", rollNo: 14, section: "B", attendance: 89, overall: 74, subjectScores: { Math: 72, Science: 75, English: 73, Social: 71, Computer: 80 }, last7: [70, 71, 72, 73, 74, 74, 74], status: "P", note: "Improving after weekly remedial support." },
  { id: "st-018", name: "Aarav Mehta", classId: "8b", rollNo: 18, section: "B", attendance: 86, overall: 71, subjectScores: { Math: 58, Science: 66, English: 76, Social: 70, Computer: 83 }, last7: [76, 74, 73, 72, 71, 71, 71], status: "A", note: "Absent yesterday, parent follow-up pending." },
  { id: "st-019", name: "Aditi Rao", classId: "10a", rollNo: 19, section: "A", attendance: 94, overall: 85, subjectScores: { Math: 88, Science: 86, English: 82, Social: 84, Computer: 87 }, last7: [80, 81, 82, 83, 84, 85, 85], status: "P", note: "Strong board-exam readiness." },
  { id: "st-021", name: "Diya Patel", classId: "8b", rollNo: 21, section: "B", attendance: 95, overall: 84, subjectScores: { Math: 81, Science: 83, English: 87, Social: 82, Computer: 88 }, last7: [80, 81, 82, 82, 83, 84, 84], status: "P", note: "Consistent participation in group work." },
  { id: "st-024", name: "Meera Nair", classId: "9c", rollNo: 24, section: "C", attendance: 90, overall: 79, subjectScores: { Math: 74, Science: 80, English: 83, Social: 76, Computer: 82 }, last7: [77, 77, 78, 78, 79, 79, 79], status: "P", note: "Maintaining stable performance." },
  { id: "st-028", name: "Kabir Sethi", classId: "9c", rollNo: 28, section: "C", attendance: 85, overall: 69, subjectScores: { Math: 63, Science: 67, English: 71, Social: 65, Computer: 78 }, last7: [72, 71, 71, 70, 69, 69, 69], status: "A", note: "Needs attendance check-in and math support." },
  { id: "st-032", name: "Naina Kapoor", classId: "11b", rollNo: 32, section: "B", attendance: 93, overall: 87, subjectScores: { Math: 84, Science: 90, English: 86, Social: 80, Computer: 89 }, last7: [83, 84, 85, 86, 86, 87, 87], status: "P", note: "Good balance across senior subjects." },
  { id: "st-041", name: "Vivaan Sharma", classId: "12c", rollNo: 41, section: "C", attendance: 91, overall: 81, subjectScores: { Math: 78, Science: 82, English: 79, Social: 76, Computer: 85 }, last7: [78, 79, 79, 80, 80, 81, 81], status: "P", note: "Steady performance before final review cycle." },
  { id: "st-052", name: "Myra Das", classId: "preprimarya", rollNo: 52, section: "A", attendance: 98, overall: 95, subjectScores: { Math: 96, Science: 94, English: 95, Social: 93, Computer: 92 }, last7: [91, 92, 93, 94, 95, 95, 95], status: "P", note: "Excellent participation and classroom confidence." },
];
