const storage = require('../../src/services/storage');

// 'describe' est une bonne pratique pour grouper les tests par fonction
describe('Storage Service', () => {
  // Réinitialise la BDD en mémoire avant CHAQUE test
  beforeEach(() => {
    storage.reset();
    storage.seed(); // Ajoute 3 étudiants (1, 2, 3) et 3 cours (1, 2, 3)
  });

  describe('list()', () => {
    test('should list seeded students', () => {
      const students = storage.list('students');
      expect(students.length).toBe(3);
      expect(students[0].name).toBe('Alice');
    });

    test('should list seeded courses', () => {
      const courses = storage.list('courses');
      expect(courses.length).toBe(3);
      expect(courses[0].title).toBe('Math');
    });
  });

  describe('get()', () => {
    test('should get a student by ID', () => {
      const student = storage.get('students', 1);
      expect(student.name).toBe('Alice');
    });

    test('should return undefined for a non-existent ID', () => {
      const student = storage.get('students', 999);
      expect(student).toBeUndefined();
    });
  });

  describe('create()', () => {
    test('should create a new student', () => {
      const newStudent = { name: 'David', email: 'david@example.com' };
      const result = storage.create('students', newStudent);

      expect(result.name).toBe('David');
      expect(result.id).toBe(4); // 3 (seed) + 1
      expect(storage.list('students').length).toBe(4);
    });

    test('should not allow duplicate student email', () => {
      const result = storage.create('students', {
        name: 'Eve',
        email: 'alice@example.com', // Email de l'étudiant 1
      });
      expect(result.error).toBe('Email must be unique');
      expect(storage.list('students').length).toBe(3);
    });

    test('should not allow duplicate course title', () => {
      const result = storage.create('courses', {
        title: 'Math', // Titre du cours 1
        teacher: 'Someone',
      });
      expect(result.error).toBe('Course title must be unique');
      expect(storage.list('courses').length).toBe(3);
    });
  });

  describe('remove()', () => {
    test('should delete a student', () => {
      const result = storage.remove('students', 1); // Supprime Alice
      expect(result).toBe(true);
      expect(storage.list('students').length).toBe(2);
      expect(storage.get('students', 1)).toBeUndefined();
    });

    test('should return false when deleting non-existent ID', () => {
      const result = storage.remove('students', 999);
      expect(result).toBe(false);
    });

    test('should NOT delete a student enrolled in a course (Protected Deletion)', () => {
      storage.enroll(1, 1); // Inscrit Alice (1) au cours Math (1)
      const result = storage.remove('students', 1); // Tente de supprimer Alice

      expect(result.error).toBe('Cannot delete student: enrolled in a course');
      expect(storage.list('students').length).toBe(3);
    });

    test('should NOT delete a course with enrolled students (Protected Deletion)', () => {
      storage.enroll(1, 1); // Inscrit Alice (1) au cours Math (1)
      const result = storage.remove('courses', 1); // Tente de supprimer Math

      expect(result.error).toBe('Cannot delete course: students are enrolled');
      expect(storage.list('courses').length).toBe(3);
    });
  });

  describe('enroll() & unenroll()', () => {
    test('should enroll a student in a course', () => {
      const result = storage.enroll(1, 1); // Alice -> Math
      expect(result.success).toBe(true);
      const studentCourses = storage.getStudentCourses(1);
      expect(studentCourses.length).toBe(1);
      expect(studentCourses[0].title).toBe('Math');
    });

    test('should unenroll a student', () => {
      storage.enroll(1, 1); // Inscrit Alice
      let result = storage.unenroll(1, 1); // Désinscrit Alice
      expect(result.success).toBe(true);
      expect(storage.getStudentCourses(1).length).toBe(0);
    });

    test('should return error for non-existent enrollment', () => {
      const result = storage.unenroll(1, 1); // Alice n'est pas inscrite
      expect(result.error).toBe('Enrollment not found');
    });

    test('should return error for non-existent student', () => {
      const result = storage.enroll(999, 1);
      expect(result.error).toBe('Student not found');
    });

    test('should return error for non-existent course', () => {
      const result = storage.enroll(1, 999);
      expect(result.error).toBe('Course not found');
    });

    test('should return error for duplicate enrollment', () => {
      storage.enroll(1, 1); // Alice -> Math
      const result = storage.enroll(1, 1); // Alice -> Math (de nouveau)
      expect(result.error).toBe('Student already enrolled in this course');
    });

    test('should NOT enroll more than 3 students in a course (Course Full)', () => {
      storage.enroll(1, 1); // 1er étudiant
      storage.enroll(2, 1); // 2ème étudiant
      storage.enroll(3, 1); // 3ème étudiant

      // Tente d'inscrire un 4ème étudiant (créé pour l'occasion)
      const student4 = storage.create('students', {
        name: 'Extra',
        email: 'extra@example.com',
      });
      const result = storage.enroll(student4.id, 1);

      expect(result.error).toBe('Course is full');
      const courseStudents = storage.getCourseStudents(1);
      expect(courseStudents.length).toBe(3);
    });
  });
});
