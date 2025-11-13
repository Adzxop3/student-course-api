const storage = require('../services/storage');

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Liste tous les étudiants avec filtres et pagination
 *     description: Récupère une liste paginée d'étudiants, avec filtres optionnels.
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtre par nom (contient)
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filtre par email (contient)
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
 *         description: Une liste d'étudiants.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 students:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
 *                 total:
 *                   type: integer
 */
exports.listStudents = (req, res) => {
  let students = storage.list('students');
  const { name, email, page = 1, limit = 10 } = req.query;

  if (name) {
    students = students.filter((st) =>
      st.name.toLowerCase().includes(name.toLowerCase()),
    );
  }
  if (email) {
    students = students.filter((st) =>
      st.email.toLowerCase().includes(email.toLowerCase()),
    );
  }

  const start = (page - 1) * limit;
  const paginated = students.slice(start, start + Number(limit));

  res.json({ students: paginated, total: students.length });
};

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Récupère un étudiant par ID
 *     description: Récupère les détails d'un étudiant et les cours auxquels il est inscrit.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'étudiant
 *     responses:
 *       '200':
 *         description: Détails de l'étudiant.
 *       '404':
 *         description: Student not found
 */
exports.getStudent = (req, res) => {
  const student = storage.get('students', req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  const courses = storage.getStudentCourses(req.params.id);
  return res.json({ student, courses });
};

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Crée un nouvel étudiant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewStudent'
 *     responses:
 *       '201':
 *         description: Étudiant créé.
 *       '400':
 *         description: Erreur de validation (email unique, champs requis).
 */
exports.createStudent = (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email required' });
  }

  const result = storage.create('students', { name, email });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  return res.status(201).json(result);
};

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Supprime un étudiant
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'étudiant
 *     responses:
 *       '204':
 *         description: Étudiant supprimé.
 *       '400':
 *         description: Suppression protégée (étudiant inscrit).
 *       '404':
 *         description: Student not found.
 */
exports.deleteStudent = (req, res) => {
  const result = storage.remove('students', req.params.id);

  if (result === false) {
    return res.status(404).json({ error: 'Student not found' });
  }
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  return res.status(204).send();
};

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Met à jour un étudiant
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'étudiant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewStudent'
 *     responses:
 *       '200':
 *         description: Étudiant mis à jour.
 *       '400':
 *         description: Erreur de validation (email unique).
 *       '404':
 *         description: Student not found.
 */
exports.updateStudent = (req, res) => {
  const { name, email } = req.body;
  const result = storage.update('students', req.params.id, { name, email });

  if (!result) {
    return res.status(404).json({ error: 'Student not found' });
  }
  if (result.error) {
    // ex: 'Email must be unique'
    return res.status(400).json({ error: result.error });
  }
  return res.json(result);
};
