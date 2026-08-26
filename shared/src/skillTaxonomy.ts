export interface SkillTaxonomyEntry {
  id: string;
  name: string;
  category: string;
  aliases: string[];
}

export const skillTaxonomy: SkillTaxonomyEntry[] = [
  // Languages
  { id: "javascript", name: "JavaScript", category: "Languages", aliases: ["JS"] },
  { id: "typescript", name: "TypeScript", category: "Languages", aliases: ["TS"] },
  { id: "python", name: "Python", category: "Languages", aliases: [] },
  { id: "java", name: "Java", category: "Languages", aliases: [] },
  { id: "csharp", name: "C#", category: "Languages", aliases: ["C-Sharp", ".NET C#"] },
  { id: "cpp", name: "C++", category: "Languages", aliases: ["Cplusplus"] },
  { id: "c", name: "C", category: "Languages", aliases: [] },
  { id: "go", name: "Go", category: "Languages", aliases: ["Golang"] },
  { id: "rust", name: "Rust", category: "Languages", aliases: [] },
  { id: "ruby", name: "Ruby", category: "Languages", aliases: [] },
  { id: "php", name: "PHP", category: "Languages", aliases: [] },
  { id: "swift", name: "Swift", category: "Languages", aliases: [] },
  { id: "kotlin", name: "Kotlin", category: "Languages", aliases: [] },
  { id: "scala", name: "Scala", category: "Languages", aliases: [] },
  { id: "sql", name: "SQL", category: "Languages", aliases: [] },
  { id: "bash", name: "Bash", category: "Languages", aliases: ["Shell scripting", "Shell"] },

  // Frontend
  { id: "react", name: "React", category: "Frontend", aliases: ["React.js", "ReactJS"] },
  { id: "vue", name: "Vue", category: "Frontend", aliases: ["Vue.js", "VueJS"] },
  { id: "angular", name: "Angular", category: "Frontend", aliases: ["AngularJS"] },
  { id: "svelte", name: "Svelte", category: "Frontend", aliases: [] },
  { id: "html", name: "HTML", category: "Frontend", aliases: ["HTML5"] },
  { id: "css", name: "CSS", category: "Frontend", aliases: ["CSS3"] },
  { id: "sass", name: "Sass", category: "Frontend", aliases: ["SCSS"] },
  { id: "tailwind", name: "Tailwind CSS", category: "Frontend", aliases: ["TailwindCSS", "Tailwind"] },
  { id: "redux", name: "Redux", category: "Frontend", aliases: [] },
  { id: "nextjs", name: "Next.js", category: "Frontend", aliases: ["NextJS"] },

  // Backend / Frameworks
  { id: "nodejs", name: "Node.js", category: "Backend", aliases: ["NodeJS", "Node"] },
  { id: "express", name: "Express", category: "Backend", aliases: ["Express.js", "ExpressJS"] },
  { id: "django", name: "Django", category: "Backend", aliases: [] },
  { id: "flask", name: "Flask", category: "Backend", aliases: [] },
  { id: "fastapi", name: "FastAPI", category: "Backend", aliases: [] },
  { id: "spring", name: "Spring", category: "Backend", aliases: ["Spring Boot"] },
  { id: "rails", name: "Ruby on Rails", category: "Backend", aliases: ["Rails"] },
  { id: "dotnet", name: ".NET", category: "Backend", aliases: ["ASP.NET", "dotnet"] },
  { id: "graphql", name: "GraphQL", category: "Backend", aliases: [] },
  { id: "rest", name: "REST", category: "Backend", aliases: ["RESTful", "REST API"] },
  { id: "grpc", name: "gRPC", category: "Backend", aliases: [] },
  { id: "microservices", name: "Microservices", category: "Backend", aliases: [] },

  // Databases
  { id: "postgresql", name: "PostgreSQL", category: "Databases", aliases: ["Postgres"] },
  { id: "mongodb", name: "MongoDB", category: "Databases", aliases: ["Mongo"] },
  { id: "mysql", name: "MySQL", category: "Databases", aliases: [] },
  { id: "redis", name: "Redis", category: "Databases", aliases: [] },
  { id: "elasticsearch", name: "Elasticsearch", category: "Databases", aliases: ["Elastic Search"] },
  { id: "dynamodb", name: "DynamoDB", category: "Databases", aliases: [] },
  { id: "sqlite", name: "SQLite", category: "Databases", aliases: [] },
  { id: "cassandra", name: "Cassandra", category: "Databases", aliases: [] },

  // Cloud / DevOps
  { id: "aws", name: "AWS", category: "Cloud/DevOps", aliases: ["Amazon Web Services"] },
  { id: "gcp", name: "GCP", category: "Cloud/DevOps", aliases: ["Google Cloud", "Google Cloud Platform"] },
  { id: "azure", name: "Azure", category: "Cloud/DevOps", aliases: ["Microsoft Azure"] },
  { id: "docker", name: "Docker", category: "Cloud/DevOps", aliases: [] },
  { id: "kubernetes", name: "Kubernetes", category: "Cloud/DevOps", aliases: ["K8s"] },
  { id: "terraform", name: "Terraform", category: "Cloud/DevOps", aliases: [] },
  { id: "ci_cd", name: "CI/CD", category: "Cloud/DevOps", aliases: ["Continuous Integration", "Continuous Deployment"] },
  { id: "jenkins", name: "Jenkins", category: "Cloud/DevOps", aliases: [] },
  { id: "github_actions", name: "GitHub Actions", category: "Cloud/DevOps", aliases: [] },
  { id: "ansible", name: "Ansible", category: "Cloud/DevOps", aliases: [] },
  { id: "linux", name: "Linux", category: "Cloud/DevOps", aliases: [] },
  { id: "nginx", name: "Nginx", category: "Cloud/DevOps", aliases: [] },

  // Data / ML
  { id: "pandas", name: "Pandas", category: "Data/ML", aliases: [] },
  { id: "numpy", name: "NumPy", category: "Data/ML", aliases: [] },
  { id: "pytorch", name: "PyTorch", category: "Data/ML", aliases: [] },
  { id: "tensorflow", name: "TensorFlow", category: "Data/ML", aliases: [] },
  { id: "scikit_learn", name: "scikit-learn", category: "Data/ML", aliases: ["sklearn"] },
  { id: "spark", name: "Apache Spark", category: "Data/ML", aliases: ["Spark"] },
  { id: "airflow", name: "Airflow", category: "Data/ML", aliases: ["Apache Airflow"] },

  // Tools
  { id: "git", name: "Git", category: "Tools", aliases: [] },
  { id: "jira", name: "Jira", category: "Tools", aliases: [] },
  { id: "figma", name: "Figma", category: "Tools", aliases: [] },
  { id: "webpack", name: "Webpack", category: "Tools", aliases: [] },
  { id: "vite", name: "Vite", category: "Tools", aliases: [] },

  // Testing
  { id: "jest", name: "Jest", category: "Testing", aliases: [] },
  { id: "cypress", name: "Cypress", category: "Testing", aliases: [] },
  { id: "selenium", name: "Selenium", category: "Testing", aliases: [] },
  { id: "playwright", name: "Playwright", category: "Testing", aliases: [] },

  // Practices
  { id: "agile", name: "Agile", category: "Practices", aliases: ["Scrum"] },
  { id: "tdd", name: "TDD", category: "Practices", aliases: ["Test-Driven Development"] },
];
