const request = require('supertest');
const app = require('../../src/app');

describe('Student-Course API integration', () => {
  beforeEach(() => {
    require('../../src/services/storage').reset();
    require('../../src/services/storage').seed();
  });

  test('GET /students should return seeded students', async () => {
    const res = await request(app).get('/students');
    expect(res.statusCode).toBe(200);
    expect(res.body.students.length).toBe(3);
    expect(res.body.students[0].name).toBe('Alice');
  });

  test('POST /students should create a new student', async () => {
    const res = await request(app)
      .post('/students')
      .send({ name: 'David', email: 'david@example.com' });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('David');
  });

  test('POST /students should not allow duplicate email', async () => {
    const res = await request(app)
      .post('/students')
      .send({ name: 'Eve', email: 'alice@example.com' });
    expect(res.statusCode).toBe(400);
  });

  test('DELETE /courses/:id should not delete a course if students are enrolled', async () => {
    const courses = await request(app).get('/courses');
    const courseId = courses.body.courses[0].id;
    await request(app).post(`/courses/${courseId}/students/1`);
    const res = await request(app).delete(`/courses/${courseId}`);
    expect(res.statusCode).toBe(400);
  });

  // New tests for coursesController.js
  test('POST /courses should return 400 if title or teacher is missing', async () => {
    const res = await request(app)
      .post('/courses')
      .send({ title: 'New Course' }); // Missing teacher
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('title and teacher required');
  });

  test('DELETE /courses/:id should return 404 for non-existent course', async () => {
    const res = await request(app).delete('/courses/999');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Course not found');
  });

  test('PUT /courses/:id should return 404 for non-existent course', async () => {
    const res = await request(app)
      .put('/courses/999')
      .send({ title: 'Updated Title' });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Course not found');
  });

  test('PUT /courses/:id should return 400 for duplicate course title', async () => {
    const courses = await request(app).get('/courses');
    const courseIdToUpdate = courses.body.courses[1].id; // Get ID of a different course (e.g., Physics)
    const existingCourseTitle = courses.body.courses[0].title; // Get title of another course (e.g., Math)
    const res = await request(app)
      .put(`/courses/${courseIdToUpdate}`)
      .send({ title: existingCourseTitle });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Course title must be unique');
  });

  test('PUT /courses/:id should update a course successfully', async () => {
    const courses = await request(app).get('/courses');
    const courseId = courses.body.courses[0].id;
    const res = await request(app)
      .put(`/courses/${courseId}`)
      .send({ title: 'Updated Math', teacher: 'New Teacher' });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated Math');
    expect(res.body.teacher).toBe('New Teacher');
  });

  // New tests for studentsController.js
  test('GET /students/:id should return 404 for non-existent student', async () => {
    const res = await request(app).get('/students/999');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Student not found');
  });

  test('POST /students should return 400 if name or email is missing', async () => {
    const res = await request(app)
      .post('/students')
      .send({ name: 'New Student' }); // Missing email
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('name and email required');
  });

  test('DELETE /students/:id should return 404 for non-existent student', async () => {
    const res = await request(app).delete('/students/999');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Student not found');
  });

  test('DELETE /students/:id should return 400 if student is enrolled in a course', async () => {
    await request(app).post('/courses/1/students/1'); // Enroll student 1 in course 1
    const res = await request(app).delete('/students/1');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Cannot delete student: enrolled in a course');
  });

  test('PUT /students/:id should return 404 for non-existent student', async () => {
    const res = await request(app)
      .put('/students/999')
      .send({ name: 'Updated Name' });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Student not found');
  });

  test('PUT /students/:id should return 400 for duplicate student email', async () => {
    const students = await request(app).get('/students');
    const studentId = students.body.students[0].id; // Get ID of an existing student
    const res = await request(app)
      .put(`/students/${studentId}`)
      .send({ email: 'bob@example.com' }); // Duplicate email
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Email must be unique');
  });

  test('PUT /students/:id should update a student successfully', async () => {
    const students = await request(app).get('/students');
    const studentId = students.body.students[0].id;
    const res = await request(app)
      .put(`/students/${studentId}`)
      .send({ name: 'Updated Alice', email: 'alice_updated@example.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Alice');
    expect(res.body.email).toBe('alice_updated@example.com');
  });
});
