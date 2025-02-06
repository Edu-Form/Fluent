import { ObjectId } from "mongodb"
import { clientPromise } from '@/lib/mongodb';
import type { Student, Teacher } from "./definitions"


export function serialize_document(document: any) {
  if (document._id) {
    document._id = document._id.toString();  // Convert _id to string
  }
  return document;
}

export async function getStudentQuizletData(student_name: string) {
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db");

    // Find the quizlets related to the student name, sorted by date
    const filteredQuizlets = await db
      .collection("quizlet")
      .find({ student_name })
      .sort({ date: 1 })
      .toArray();  // Convert cursor to an array

    if (!filteredQuizlets || filteredQuizlets.length === 0) {
      return null;  // Return null if no quizlets are found
    }

    // Serialize the documents before returning (optional, but generally recommended)
    return filteredQuizlets.map(serialize_document);
  } catch (error) {
    console.error("Error fetching diaries:", error);
    return null;
  }
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

export const getRoomData = async (date: string, time: string) => {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const filteredSchedules = await db
      .collection("schedules")
      .find({ date: date.replace(/%20/g, ' '), time})
      .sort({ room_name: 1 })
      .toArray(); // Convert to array (MongoDB cursor)
    console.log(filteredSchedules)
    
    // Get all room names
    const db2 = client.db("room_allocation_db");
    const allRooms = await db2
      .collection("roomList")
      .find().toArray();
    const allRoomNames = allRooms.map((room) => room.room_name);

    // Create a Set of unavailable rooms
    const unavailableRooms = new Set(filteredSchedules.map((schedule) => schedule.room_name));

    // Filter out unavailable rooms from the allRoomNames list
    const availableRooms = allRoomNames.filter((roomName) => !unavailableRooms.has(roomName));

    console.log(availableRooms)
    return availableRooms.map(serialize_document); // Serialize and return
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw new Error("Database error");
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

export async function deductCredit(student_name: string, date: string) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const studentData = await db.collection("students").findOne({ name: student_name })|| { paymentHistory: "" };
    const result = await db.collection("students").updateOne({ name: student_name }, { $inc: { credits: -1 } });
    const result2 = await db.collection("students").updateOne(
      { name: student_name },
      { $set: { paymentHistory: `${studentData.paymentHistory} ${date}: Credit -1`} }
    );
    return result;
  } catch (error) {
    console.error("Error deducting credit:", error);
    throw new Error("Database error");
  }
}

export async function saveScheduleData(schedule: any) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const result = await db.collection("schedules").insertOne(schedule);
    return result.insertedId.toString();
  } catch (error) {
    console.error("Error saving schedule:", error);
    throw new Error("Database error");
  }
}


export async function getTodayScheduleData(date: string, user: string) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const filteredSchedules = await db
      .collection("schedules").find({ date: date.replace(/%20/g, ' '), teacher_name: user })
      // .find({ date, teacher_name: user })
      .sort({ time: 1 })
      .toArray(); // Convert to array (MongoDB cursor)

    console.log(filteredSchedules)
    const parsedSchedule = filteredSchedules.map(schedule => ({
      room_name: schedule.room_name,
      student_name: schedule.student_name,
      time: schedule.time,
      time_range: `${schedule.time - 12}pm ~ ${schedule.time - 11}pm`
    }));

    return parsedSchedule;
  } catch (error) {
    console.error("Error fetching one day one teacher schedule:", error);
    throw new Error("Database error");
  }
}



export async function saveManyScheduleData(schedule: any) {
  try {
    const { dates, time, duration, teacher_name, student_name } = schedule;
    const allSavedRooms = [];

    for (const date of dates) {
      const availableRooms = await getRoomData(date, time);

      if (availableRooms.length === 0) {
        return { status_code: 400, error: "No available rooms" };
      }

      const room_name = availableRooms[0];
      const each_schedule = { room_name, date, time, duration, teacher_name, student_name };
      await saveScheduleData(each_schedule);
      allSavedRooms.push(room_name);
    }

    return { status_code: 200, all_dates: dates, all_rooms: allSavedRooms, time };
  } catch (error) {
    console.error("Error saving schedules:", error);
    throw new Error("Database error");
  }
}

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


export async function saveDiaryData(diary: any, diary_correction: string, diary_expressions: string, diary_summary: string) {
  
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db");

    const modified_diary = {
      student_name: diary.student_name,
      class_date: diary.class_date,
      date: diary.date,
      original_text: diary.original_text,
      diary_correction: diary_correction,
      diary_expressions: diary_expressions,
      diary_summary: diary_summary
    };

    const result = await db.collection("diary").insertOne(modified_diary);

    return {
      status_code: 200,
      id: result.insertedId.toString(),
      student_name: diary.student_name,
      date: diary.date,
      message: modified_diary
    };
  } catch (error) {
    console.error("Error saving diary:", error);
    throw new Error("Database error");
  }
}


export async function saveQuizletData(quizlet: any, kor_quizlet: string[], eng_quizlet: string[]) {
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db");

    const modified_quizlet = {
      student_name: quizlet.student_name,
      class_date: quizlet.class_date,
      date: quizlet.date,
      original_text: quizlet.original_text,
      eng_quizlet,
      kor_quizlet
    };

    const result = await db.collection("quizlet").insertOne(modified_quizlet);

    return {
      status_code: 200,
      id: result.insertedId.toString(),
      student_name: quizlet.student_name,
      date: quizlet.date,
      eng_quizlet,
      kor_quizlet
    };
  } catch (error) {
    console.error("Error saving quizlet:", error);
    throw new Error("Database error");
  }
}



