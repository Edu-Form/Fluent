import { ObjectId } from "mongodb"
import { clientPromise } from '@/lib/mongodb';
import type { Student, Teacher } from "./definitions"


export function serialize_document(document: any) {
  if (document._id) {
    document._id = document._id.toString();  // Convert _id to string
  }
  return document;
}

export async function getStudentDiaryData(student_name: string) {
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db");

    // Find the diaries related to the student name, sorted by date
    const filteredDiaries = await db
      .collection("diary")
      .find({ student_name })
      .sort({ date: 1 })
      .toArray();  // Convert cursor to an array
    console.log(filteredDiaries)
    if (!filteredDiaries || filteredDiaries.length === 0) {
      return null;  // Return null if no diaries are found
    }

    // Serialize the documents before returning (optional, but generally recommended)
    return filteredDiaries.map(serialize_document);
  } catch (error) {
    console.error("Error fetching diaries:", error);
    return null;
  }
}

export async function getStudentListData(teacherName: string) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");

    // Find the students related to the teacher name
    const filteredStudents = await db
      .collection("students")
      .find({ teacher: teacherName })
      .sort({ name: 1 })
      .toArray();  // Convert cursor to an array

    if (!filteredStudents || filteredStudents.length === 0) {
      return null;  // Return null if no students are found
    }

    // Serialize the documents before returning (optional, but generally recommended)
    return filteredStudents.map(student => student.name);
  } catch (error) {
    console.error("Error fetching students:", error);
    return null;
  }
}



// Function to get teacher's schedule
export const getTeacherScheduleData = async (teacherName: string) => {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const teacherSchedule = await db
      .collection("schedules")
      .find({ teacher_name: teacherName })
      .sort({ date: 1, time: 1, room_name: 1 })
      .toArray(); // Convert to array (MongoDB cursor)

    return teacherSchedule.map(serialize_document); // Serialize and return
  } catch (error) {
    console.error("Error fetching teacher schedule:", error);
    throw new Error("Database error");
  }
};

// Function to get student's schedule
export const getStudentScheduleData = async (studentName: string) => {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const studentSchedule = await db
      .collection("schedules")
      .find({ student_name: studentName })
      .sort({ date: 1, time: 1, room_name: 1 })
      .toArray(); // Convert to array (MongoDB cursor)

    return studentSchedule.map(serialize_document); // Serialize and return
  } catch (error) {
    console.error("Error fetching student schedule:", error);
    throw new Error("Database error");
  }
};

export async function getUserData(username: string): Promise<Student | Teacher | null>{
  try {
    const client = await clientPromise;
    const db = client.db("school_management");

    // Search in "teachers" collection first
    const teacher = await db.collection("teachers").findOne({ phoneNumber: username });
    if (teacher) return teacher as unknown as Teacher;

    // If not found, search in "students" collection
    const student = await db.collection("students").findOne({ phoneNumber: username });
    if (student) return student as unknown as Student;

    // No user found
    return null;
  } catch (error) {
    console.error("Error fetching user data from MongoDB:", error);
    
    // Ensure a value is always returned, even if an error occurs
    return null;
  }
}






export async function getStudents(): Promise<Student[]> {
  const client = await clientPromise
  const database = client.db("school_management")
  const students = database.collection("students")
  const result = await students.find({}).sort({ createdAt: -1 }).toArray()
  return result.map((doc:any) => ({
    ...doc,
    _id: doc._id.toString(),
    credits: doc.credits || 0,
    paymentHistory: doc.paymentHistory || "",
  })) as Student[]
}

export async function updateStudent(id: string, update: Partial<Student>): Promise<Student> {
    const client = await clientPromise
    const database = client.db("school_management")
    const students = database.collection("students")
    const result = await students.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" },
    )

    if (result == null) {
      throw new Error(`Student with ID ${id} not found or not updated.`);
    }
    return { ...result, _id: result._id.toString() } as Student
  }
  

export async function addStudent(student: Omit<Student, "_id">): Promise<Student> {
  const client = await clientPromise
  const database = client.db("school_management")
  const students = database.collection("students")
  const result = await students.insertOne(student)
  return { ...student, _id: result.insertedId.toString() } as Student
}

export async function getTeachers(): Promise<Teacher[]> {
    const client = await clientPromise
    const database = client.db("school_management")
    const teachers = database.collection("teachers")
    const result = await teachers.find({}).toArray()
    return result.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
    })) as Teacher[]
  }
  
  export async function addTeacher(teacher: Omit<Teacher, "_id">): Promise<Teacher> {
    const client = await clientPromise
    const database = client.db("school_management")
    const teachers = database.collection("teachers")
    const result = await teachers.insertOne(teacher)
    return { ...teacher, _id: result.insertedId.toString() } as Teacher
  }
  
  export async function updateTeacher(id: string, update: Partial<Teacher>): Promise<Teacher> {
    const client = await clientPromise
    const database = client.db("school_management")
    const teachers = database.collection("teachers")
    const result = await teachers.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" },
    )
    if (result == null) {
      throw new Error(`Student with ID ${id} not found or not updated.`);
    }
    return { ...result, _id: result._id.toString() } as Teacher
  }