module.exports = {
  openapi: "3.0.0",
  info: {
    title: "StudentCourseAPI",
    version: "1.0.0",
    description: "API pédagogique pour gérer étudiants et cours (no DB)",
  },
  components: {
    schemas: {
      Student: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "The student ID.",
          },
          name: {
            type: "string",
            description: "The student name.",
          },
          email: {
            type: "string",
            description: "The student email.",
          },
        },
      },
      Course: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "The course ID.",
          },
          title: {
            type: "string",
            description: "The course title.",
          },
          teacher: {
            type: "string",
            description: "The course teacher.",
          },
        },
      },
    },
  },
};
