const express = require('express');

const {
  listCourses,
  getCourse,
  createCourse,
  deleteCourse,
  updateCourse,
} = require('../controllers/coursesController');

const router = express.Router();

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Retrieve a list of courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: A list of courses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 */
router.get('/', listCourses);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get a course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The course ID
 *     responses:
 *       200:
 *         description: The course description by ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       404:
 *         description: The course was not found
 */
router.get('/:id', getCourse);

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       201:
 *         description: The course was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       400:
 *         description: Some parameters are missing or invalid
 */
router.post('/', createCourse);

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Delete a course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The course ID
 *     responses:
 *       204:
 *         description: The course was deleted
 *       404:
 *         description: The course was not found
 */
router.delete('/:id', deleteCourse);

/**
 * @swagger
 * /courses/{courseId}/students/{studentId}:
 *   post:
 *     summary: Enroll a student in a course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The course ID
 *       - in: path
 *         name: studentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The student ID
 *     responses:
 *       201:
 *         description: The student was enrolled
 *       400:
 *         description: The student or course was not found
 */
router.post('/:courseId/students/:studentId', (req, res) => {
  const result = require('../services/storage').enroll(
    req.params.studentId,
    req.params.courseId,
  );
  if (result.error) return res.status(400).json({ error: result.error });
  return res.status(201).json({ success: true });
});

/**
 * @swagger
 * /courses/{courseId}/students/{studentId}:
 *   delete:
 *     summary: Unenroll a student from a course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The course ID
 *       - in: path
 *         name: studentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The student ID
 *     responses:
 *       204:
 *         description: The student was unenrolled
 *       404:
 *         description: The enrollment was not found
 */
router.delete('/:courseId/students/:studentId', (req, res) => {
  const result = require('../services/storage').unenroll(
    req.params.studentId,
    req.params.courseId,
  );
  if (result.error) return res.status(404).json({ error: result.error });
  return res.status(204).send();
});

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update a course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       200:
 *         description: The course was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       404:
 *         description: The course was not found
 */
router.put('/:id', updateCourse);

module.exports = router;
