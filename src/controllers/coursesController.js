const storage = require('../services/storage');

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Liste tous les cours avec filtres et pagination
 *     description: Récupère une liste paginée de cours.
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filtre par titre (contient)
 *       - in: query
 *         name: teacher
 *         schema:
 *           type: string
 *         description: Filtre par nom du professeur (contient)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       '200':
 *         description: Une liste de cours.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *                 total:
 *                   type: integer
 */
exports.listCourses = (req, res) => {
  let courses = storage.list('courses');
  const { title, teacher, page = 1, limit = 10 } = req.query;

  if (title) {
    courses = courses.filter((c) =>
      c.title.toLowerCase().includes(title.toLowerCase()),
    );
  }
  if (teacher) {
    courses = courses.filter((c) =>
      c.teacher.toLowerCase().includes(teacher.toLowerCase()),
    );
  }

  const start = (page - 1) * limit;
  const paginated = courses.slice(start, start + Number(limit));
  res.json({ courses: paginated, total: courses.length });
};

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Récupère un cours par ID
 *     description: Récupère les détails d'un cours et les étudiants qui y sont inscrits.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du cours
 *     responses:
 *       '200':
 *         description: Détails du cours et liste des étudiants.
 *       '404':
 *         description: Course not found
 */
exports.getCourse = (req, res) => {
  const course = storage.get('courses', req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  const students = storage.getCourseStudents(req.params.id);
  return res.json({ course, students });
};

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Crée un nouveau cours
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewCourse'
 *     responses:
 *       '201':
 *         description: Cours créé.
 *       '400':
 *         description: Erreur de validation (titre unique, champs requis).
 */
exports.createCourse = (req, res) => {
  const { title, teacher } = req.body;
  if (!title || !teacher) {
    return res.status(400).json({ error: 'title and teacher required' });
  }

  const result = storage.create('courses', { title, teacher });
  // Gère l'erreur d'unicité renvoyée par le service storage
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  return res.status(201).json(result);
};

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Supprime un cours
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du cours
 *     responses:
 *       '204':
 *         description: Cours supprimé.
 *       '400':
 *         description: Suppression protégée (étudiants inscrits).
 *       '404':
 *         description: Course not found.
 */
exports.deleteCourse = (req, res) => {
  const result = storage.remove('courses', req.params.id);

  if (result === false) {
    return res.status(404).json({ error: 'Course not found' });
  }
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  return res.status(204).send();
};

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Met à jour un cours
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du cours
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewCourse'
 *     responses:
 *       '200':
 *         description: Cours mis à jour.
 *       '400':
 *         description: Erreur de validation (titre unique).
 *       '404':
 *         description: Course not found.
 */
exports.updateCourse = (req, res) => {
  const { title, teacher } = req.body;
  // Utilise la fonction 'update' du service storage
  const result = storage.update('courses', req.params.id, { title, teacher });

  if (!result) {
    return res.status(404).json({ error: 'Course not found' });
  }
  if (result.error) {
    // ex: 'Course title must be unique'
    return res.status(400).json({ error: result.error });
  }
  return res.json(result);
};

/**
 * @swagger
 * /courses/{courseId}/students/{studentId}:
 *   post:
 *     summary: Inscrit un étudiant à un cours
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Inscription réussie.
 *       '400':
 *         description: Erreur (cours plein, déjà inscrit).
 *       '404':
 *         description: Étudiant ou cours non trouvé.
 */
exports.enrollStudent = (req, res) => {
  const { studentId, courseId } = req.params;
  const result = storage.enroll(studentId, courseId);
  if (result.error) {
    if (
      result.error === 'Course not found' ||
      result.error === 'Student not found'
    ) {
      return res.status(404).json(result);
    }
    return res.status(400).json(result);
  }
  return res.json(result);
};

/**
 * @swagger
 * /courses/{courseId}/students/{studentId}:
 *   delete:
 *     summary: Désinscrit un étudiant d'un cours
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Désinscription réussie.
 *       '404':
 *         description: Inscription non trouvée.
 */
exports.unenrollStudent = (req, res) => {
  const { studentId, courseId } = req.params;
  const result = storage.unenroll(studentId, courseId);
  if (result.error) {
    return res.status(404).json(result); // 'Enrollment not found'
  }
  return res.json(result);
};
