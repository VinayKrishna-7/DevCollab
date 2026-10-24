import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const prisma = new PrismaClient();

async function hashPwd(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1
  });
}

async function main() {
  console.log('Seeding DevCollab database...');

  // 1. Clean existing records in correct order to avoid foreign key violations
  await prisma.activityLog.deleteMany();
  await prisma.discussionMessage.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.joinRequest.deleteMany();
  await prisma.projectMembership.deleteMany();
  await prisma.projectSkill.deleteMany();
  await prisma.report.deleteMany();
  await prisma.project.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.developerProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.skill.deleteMany();

  console.log('Cleared existing data.');

  // 2. Seed Skills Catalog
  const skillDefinitions = [
    { name: 'JavaScript', category: 'Frontend' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'React', category: 'Frontend' },
    { name: 'Next.js', category: 'Frontend' },
    { name: 'Vue.js', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Express', category: 'Backend' },
    { name: 'Python', category: 'Backend' },
    { name: 'FastAPI', category: 'Backend' },
    { name: 'Django', category: 'Backend' },
    { name: 'Go', category: 'Backend' },
    { name: 'Rust', category: 'Systems' },
    { name: 'Java', category: 'Backend' },
    { name: 'Spring Boot', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'MongoDB', category: 'Database' },
    { name: 'Redis', category: 'Database' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'Kubernetes', category: 'DevOps' },
    { name: 'AWS', category: 'Cloud' },
    { name: 'GraphQL', category: 'Backend' },
    { name: 'Machine Learning', category: 'AI/ML' },
    { name: 'PyTorch', category: 'AI/ML' },
    { name: 'TensorFlow', category: 'AI/ML' },
    { name: 'UI/UX Design', category: 'Design' },
    { name: 'Figma', category: 'Design' },
    { name: 'Tailwind CSS', category: 'Frontend' },
    { name: 'Git', category: 'DevOps' },
    { name: 'Testing', category: 'QA' }
  ];

  const skillMap = {};
  for (const s of skillDefinitions) {
    const created = await prisma.skill.create({
      data: s
    });
    skillMap[s.name] = created.id;
  }
  console.log(`Seeded ${skillDefinitions.length} skills.`);

  // 3. Seed Admin Account
  const adminPassword = process.env.DEV_ADMIN_PASSWORD || 'DevCollabAdmin2026!';
  const adminPasswordHash = await hashPwd(adminPassword);

  const adminUser = await prisma.user.create({
    data: {
      email: process.env.DEV_ADMIN_EMAIL || 'admin@devcollab.io',
      username: process.env.DEV_ADMIN_USERNAME || 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      profile: {
        create: {
          displayName: process.env.DEV_ADMIN_NAME || 'DevCollab Administrator',
          headline: 'Platform Administrator & Core Maintainer',
          bio: 'Platform administration and developer community steward at DevCollab.',
          experienceLevel: 'EXPERT',
          availability: 'AVAILABLE',
          weeklyHours: 40,
          collaborationType: 'OPEN_SOURCE',
          areasOfInterest: ['DevTools', 'Web Development', 'Security'],
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          githubUrl: 'https://github.com/devcollab-admin',
          visibility: 'PUBLIC'
        }
      }
    }
  });

  // 4. Seed Developers
  const devPasswordHash = await hashPwd('Password123!');

  const developersData = [
    {
      email: 'alex.rivera@example.com',
      username: 'alexrivera',
      displayName: 'Alex Rivera',
      headline: 'Senior Full-Stack Engineer | React & Node.js Specialist',
      bio: 'Over 6 years of experience architecting resilient web applications. Passionate about developer tooling, performant UI components, and real-time collaboration engines.',
      experienceLevel: 'ADVANCED',
      availability: 'AVAILABLE',
      weeklyHours: 20,
      location: 'San Francisco, CA',
      collaborationType: 'STARTUP',
      areasOfInterest: ['Web Development', 'DevTools', 'Open Source'],
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      githubUrl: 'https://github.com/alexrivera',
      skills: [
        { name: 'JavaScript', proficiency: 'EXPERT', years: 6 },
        { name: 'TypeScript', proficiency: 'ADVANCED', years: 5 },
        { name: 'React', proficiency: 'EXPERT', years: 5 },
        { name: 'Node.js', proficiency: 'ADVANCED', years: 4 },
        { name: 'PostgreSQL', proficiency: 'INTERMEDIATE', years: 4 },
        { name: 'Docker', proficiency: 'INTERMEDIATE', years: 3 }
      ]
    },
    {
      email: 'elena.rostova@example.com',
      username: 'elenarostova',
      displayName: 'Elena Rostova',
      headline: 'Machine Learning Engineer & Data Scientist',
      bio: 'M.S. in Computer Science. Specialized in NLP, transformer models, retrieval-augmented generation (RAG), and deploying scalable inference pipelines in production.',
      experienceLevel: 'EXPERT',
      availability: 'LIMITED',
      weeklyHours: 12,
      location: 'Berlin, Germany',
      collaborationType: 'OPEN_SOURCE',
      areasOfInterest: ['AI/ML', 'Data Science', 'Python'],
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      githubUrl: 'https://github.com/elenarostova',
      skills: [
        { name: 'Python', proficiency: 'EXPERT', years: 6 },
        { name: 'Machine Learning', proficiency: 'EXPERT', years: 5 },
        { name: 'PyTorch', proficiency: 'ADVANCED', years: 4 },
        { name: 'FastAPI', proficiency: 'ADVANCED', years: 3 },
        { name: 'Docker', proficiency: 'INTERMEDIATE', years: 3 }
      ]
    },
    {
      email: 'marcus.chen@example.com',
      username: 'marcuschen',
      displayName: 'Marcus Chen',
      headline: 'Product Designer & Frontend Developer',
      bio: 'Bridging the divide between design systems and crisp React code. I love designing accessible micro-interactions, cohesive component libraries, and intuitive developer flows.',
      experienceLevel: 'INTERMEDIATE',
      availability: 'AVAILABLE',
      weeklyHours: 15,
      location: 'Toronto, Canada',
      collaborationType: 'HACKATHON',
      areasOfInterest: ['UI/UX Design', 'Web Development'],
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      githubUrl: 'https://github.com/marcuschen',
      skills: [
        { name: 'UI/UX Design', proficiency: 'EXPERT', years: 4 },
        { name: 'Figma', proficiency: 'EXPERT', years: 4 },
        { name: 'React', proficiency: 'INTERMEDIATE', years: 3 },
        { name: 'Tailwind CSS', proficiency: 'ADVANCED', years: 3 },
        { name: 'JavaScript', proficiency: 'INTERMEDIATE', years: 3 }
      ]
    },
    {
      email: 'priya.sharma@example.com',
      username: 'priyasharma',
      displayName: 'Priya Sharma',
      headline: 'Cloud Architect & Backend Systems Engineer',
      bio: 'Cloud enthusiast focused on distributed microservices, event-driven backends, and container orchestration. Always eager to team up on high-throughput backend projects.',
      experienceLevel: 'ADVANCED',
      availability: 'AVAILABLE',
      weeklyHours: 18,
      location: 'Bengaluru, India',
      collaborationType: 'STARTUP',
      areasOfInterest: ['DevTools', 'Cloud', 'Cybersecurity'],
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      githubUrl: 'https://github.com/priyasharma',
      skills: [
        { name: 'Go', proficiency: 'ADVANCED', years: 4 },
        { name: 'Node.js', proficiency: 'ADVANCED', years: 4 },
        { name: 'AWS', proficiency: 'EXPERT', years: 5 },
        { name: 'Kubernetes', proficiency: 'ADVANCED', years: 3 },
        { name: 'PostgreSQL', proficiency: 'ADVANCED', years: 4 },
        { name: 'Redis', proficiency: 'ADVANCED', years: 3 }
      ]
    },
    {
      email: 'lucas.silva@example.com',
      username: 'lucassilva',
      displayName: 'Lucas Silva',
      headline: 'Full-Stack Developer & Open Source Contributor',
      bio: 'Passionate self-taught dev building open source tools and learning modern stacks. Looking to collaborate on real-world projects with experienced mentors.',
      experienceLevel: 'BEGINNER',
      availability: 'AVAILABLE',
      weeklyHours: 25,
      location: 'Sao Paulo, Brazil',
      collaborationType: 'LEARNING',
      areasOfInterest: ['Web Development', 'Open Source'],
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      githubUrl: 'https://github.com/lucassilva',
      skills: [
        { name: 'JavaScript', proficiency: 'INTERMEDIATE', years: 2 },
        { name: 'React', proficiency: 'BEGINNER', years: 1 },
        { name: 'Node.js', proficiency: 'BEGINNER', years: 1 },
        { name: 'Git', proficiency: 'INTERMEDIATE', years: 2 }
      ]
    },
    {
      email: 'sophie.martin@example.com',
      username: 'sophiemartin',
      displayName: 'Sophie Martin',
      headline: 'Mobile App Developer | React Native & Flutter',
      bio: 'Creating smooth, gesture-driven mobile applications with delightful native animations. Built and published 4 mobile apps on both iOS App Store and Google Play.',
      experienceLevel: 'ADVANCED',
      availability: 'LIMITED',
      weeklyHours: 10,
      location: 'Paris, France',
      collaborationType: 'PERSONAL_PROJECT',
      areasOfInterest: ['Mobile Development', 'UI/UX Design'],
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      githubUrl: 'https://github.com/sophiemartin',
      skills: [
        { name: 'React', proficiency: 'ADVANCED', years: 4 },
        { name: 'TypeScript', proficiency: 'ADVANCED', years: 3 },
        { name: 'UI/UX Design', proficiency: 'INTERMEDIATE', years: 3 },
        { name: 'Node.js', proficiency: 'INTERMEDIATE', years: 2 }
      ]
    }
  ];

  const devMap = {};
  for (const dev of developersData) {
    const user = await prisma.user.create({
      data: {
        email: dev.email,
        username: dev.username,
        passwordHash: devPasswordHash,
        role: 'USER',
        profile: {
          create: {
            displayName: dev.displayName,
            headline: dev.headline,
            bio: dev.bio,
            experienceLevel: dev.experienceLevel,
            availability: dev.availability,
            weeklyHours: dev.weeklyHours,
            location: dev.location,
            collaborationType: dev.collaborationType,
            areasOfInterest: dev.areasOfInterest,
            avatarUrl: dev.avatarUrl,
            githubUrl: dev.githubUrl,
            visibility: 'PUBLIC'
          }
        }
      }
    });

    devMap[dev.username] = user;

    // Attach user skills
    for (const s of dev.skills) {
      if (skillMap[s.name]) {
        await prisma.userSkill.create({
          data: {
            userId: user.id,
            skillId: skillMap[s.name],
            proficiency: s.proficiency,
            yearsOfExperience: s.years
          }
        });
      }
    }
  }
  console.log(`Seeded ${developersData.length} developers.`);

  // 5. Seed 10 Realistic Software Projects
  const projectsData = [
    {
      owner: 'alexrivera',
      title: 'DevCollab Real-Time Analytics Engine',
      slug: 'devcollab-realtime-analytics-engine-a1b2',
      summary: 'High-performance real-time analytics aggregation and streaming dashboard for developer team metrics.',
      description: 'We are architecting a streaming telemetry engine that tracks team productivity, task completion velocity, and commit distribution. Features an event-driven Node.js & Redis backend paired with a reactive Canvas/SVG visualization client.',
      category: 'DEVTOOLS',
      visibility: 'PUBLIC',
      recruitmentStatus: 'RECRUITING',
      desiredTeamSize: 4,
      experiencePreference: 'INTERMEDIATE',
      collaborationType: 'OPEN_SOURCE',
      expectedDuration: '2-3 months',
      repoUrl: 'https://github.com/alexrivera/analytics-engine',
      skills: ['React', 'Node.js', 'Redis', 'TypeScript']
    },
    {
      owner: 'elenarostova',
      title: 'SkillGraph: Developer Experience & Knowledge Graph Parser',
      slug: 'skillgraph-developer-knowledge-graph-parser-c3d4',
      summary: 'Automated extraction of technical competencies, framework dependencies, and project context from repository ASTs.',
      description: 'Building an open-source parsing pipeline leveraging FastAPI, tree-sitter AST parsers, and graph database storage. We need a frontend engineer to craft an interactive visual feedback tool for developers to review parsed dependency graphs.',
      category: 'DEVTOOLS',
      visibility: 'PUBLIC',
      recruitmentStatus: 'RECRUITING',
      desiredTeamSize: 3,
      experiencePreference: 'ADVANCED',
      collaborationType: 'STARTUP',
      expectedDuration: '1-2 months',
      repoUrl: 'https://github.com/elenarostova/skillgraph',
      skills: ['Python', 'FastAPI', 'PostgreSQL', 'React']
    },
    {
      owner: 'marcuschen',
      title: 'OmniDesign: Accessible Token Design System',
      slug: 'omnidesign-accessible-token-design-system-e5f6',
      summary: 'A unified, WCAG 2.2 AAA compliant React UI component library based on design tokens and Tailwind CSS.',
      description: 'We are creating a production-ready component library prioritizing keyboard navigation, screen reader accessibility, and micro-interactions. Looking for front-end developers and QA testers to help build components and write automated accessibility tests.',
      category: 'WEB_DEVELOPMENT',
      visibility: 'PUBLIC',
      recruitmentStatus: 'RECRUITING',
      desiredTeamSize: 4,
      experiencePreference: 'INTERMEDIATE',
      collaborationType: 'OPEN_SOURCE',
      expectedDuration: '3-4 months',
      skills: ['React', 'UI/UX Design', 'Figma', 'Testing']
    },
    {
      owner: 'priyasharma',
      title: 'KubeWatch: Lightweight Cluster Telemetry CLI',
      slug: 'kubewatch-cluster-telemetry-cli-g7h8',
      summary: 'Terminal dashboard and alerting sidecar for Kubernetes pod health, log aggregation, and memory pressure.',
      description: 'KubeWatch is an efficient Go CLI and terminal UI that monitors resource usage across microservice pods without requiring heavyweight Prometheus instances. Recruiting Go and Docker specialists.',
      category: 'DEVTOOLS',
      visibility: 'PUBLIC',
      recruitmentStatus: 'IN_PROGRESS',
      desiredTeamSize: 3,
      experiencePreference: 'ADVANCED',
      collaborationType: 'OPEN_SOURCE',
      expectedDuration: '2 months',
      skills: ['Go', 'Kubernetes', 'Docker', 'AWS']
    },
    {
      owner: 'sophiemartin',
      title: 'PulseFit: Offline-First Fitness Companion',
      slug: 'pulsefit-offline-first-fitness-companion-i9j0',
      summary: 'React Native workout tracker featuring offline SQLite sync, interactive graphs, and audio coaching.',
      description: 'Developing a privacy-first mobile fitness app. All biometric data remains stored strictly on-device with optional encrypted peer-to-peer cloud backups. Looking for a React Native engineer and backend architect.',
      category: 'MOBILE_DEVELOPMENT',
      visibility: 'PUBLIC',
      recruitmentStatus: 'RECRUITING',
      desiredTeamSize: 3,
      experiencePreference: 'INTERMEDIATE',
      collaborationType: 'PERSONAL_PROJECT',
      expectedDuration: '2-3 months',
      skills: ['React', 'TypeScript', 'Node.js']
    },
    {
      owner: 'alexrivera',
      title: 'GitScribe: Pull Request Changelog & Review Automation',
      slug: 'gitscribe-pr-changelog-automation-k1l2',
      summary: 'GitHub Action that automatically inspects git diffs and writes structured, markdown-formatted PR descriptions and test checklists.',
      description: 'A developer productivity action that converts code modifications into clear change logs, testing checklists, and potential regression flags before merge.',
      category: 'DEVTOOLS',
      visibility: 'PUBLIC',
      recruitmentStatus: 'COMPLETED',
      desiredTeamSize: 2,
      experiencePreference: 'ADVANCED',
      collaborationType: 'OPEN_SOURCE',
      expectedDuration: '1 month',
      skills: ['TypeScript', 'Node.js', 'Git']
    },
    {
      owner: 'elenarostova',
      title: 'DataSight: Interactive Geo-Spatial Climate Visualizer',
      slug: 'datasight-geospatial-climate-visualizer-m3n4',
      summary: 'Data science platform charting environmental temperature anomalies across global sensor nodes in 3D.',
      description: 'Interactive visualization tool processing climate dataset archives with Python and WebGL maps. Looking for data engineers and frontend visualization wizards.',
      category: 'DATA_SCIENCE',
      visibility: 'PUBLIC',
      recruitmentStatus: 'RECRUITING',
      desiredTeamSize: 4,
      experiencePreference: 'INTERMEDIATE',
      collaborationType: 'LEARNING',
      expectedDuration: '3 months',
      skills: ['Python', 'Machine Learning', 'JavaScript']
    },
    {
      owner: 'priyasharma',
      title: 'ZeroVault: End-to-End Encrypted Secret Sharing',
      slug: 'zerovault-encrypted-secret-sharing-o5p6',
      summary: 'Zero-knowledge, single-use credential and API key sharing platform for engineering teams.',
      description: 'Secure micro-app where shared secrets are encrypted client-side using WebCrypto and automatically incinerated from memory upon initial decryption.',
      category: 'CYBERSECURITY',
      visibility: 'PUBLIC',
      recruitmentStatus: 'RECRUITING',
      desiredTeamSize: 3,
      experiencePreference: 'ADVANCED',
      collaborationType: 'STARTUP',
      expectedDuration: '2 months',
      skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis']
    },
    {
      owner: 'lucassilva',
      title: 'CodeSnippetHub: Developer Bookmark Manager',
      slug: 'codesnippethub-developer-bookmark-manager-q7r8',
      summary: 'Clean, taggable code snippet bookmark manager with syntax highlighting, search, and Markdown notes.',
      description: 'A beginner-friendly project for developers who want to organize snippets, command recipes, and cheat sheets. Perfect for learning React, Express, and PostgreSQL together!',
      category: 'WEB_DEVELOPMENT',
      visibility: 'PUBLIC',
      recruitmentStatus: 'RECRUITING',
      desiredTeamSize: 3,
      experiencePreference: 'BEGINNER',
      collaborationType: 'LEARNING',
      expectedDuration: '1-2 months',
      skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL']
    },
    {
      owner: 'alexrivera',
      title: 'Distributed Cron Orchestrator (Draft)',
      slug: 'distributed-cron-orchestrator-s9t0',
      summary: 'Draft specification for a fault-tolerant multi-node job scheduler in Node.js.',
      description: 'High availability task dispatcher featuring leader election and jitter-resistant queueing. Currently outlining architecture requirements.',
      category: 'DEVTOOLS',
      visibility: 'PRIVATE',
      recruitmentStatus: 'DRAFT',
      desiredTeamSize: 2,
      experiencePreference: 'EXPERT',
      collaborationType: 'PERSONAL_PROJECT',
      skills: ['Node.js', 'Redis', 'Docker']
    }
  ];

  const projectMap = {};
  for (const p of projectsData) {
    const ownerUser = devMap[p.owner];
    const project = await prisma.project.create({
      data: {
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        description: p.description,
        category: p.category,
        visibility: p.visibility,
        recruitmentStatus: p.recruitmentStatus,
        desiredTeamSize: p.desiredTeamSize,
        experiencePreference: p.experiencePreference,
        collaborationType: p.collaborationType,
        expectedDuration: p.expectedDuration,
        repoUrl: p.repoUrl || null,
        ownerId: ownerUser.id,
        startDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      }
    });

    projectMap[p.slug] = project;

    // Attach required skills
    for (const skillName of p.skills) {
      if (skillMap[skillName]) {
        await prisma.projectSkill.create({
          data: {
            projectId: project.id,
            skillId: skillMap[skillName],
            importance: 'REQUIRED'
          }
        });
      }
    }

    // Add owner as member
    await prisma.projectMembership.create({
      data: {
        projectId: project.id,
        userId: ownerUser.id,
        role: 'OWNER'
      }
    });

    // Record creation activity
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        actorId: ownerUser.id,
        action: 'PROJECT_CREATED',
        entityType: 'PROJECT',
        entityId: project.id,
        metadata: JSON.stringify({ title: project.title })
      }
    });
  }
  console.log(`Seeded ${projectsData.length} projects.`);

  // 6. Seed Project Memberships & Join Requests
  // Add Marcus Chen and Priya Sharma to DevCollab Real-Time Analytics Engine
  const analyticsProject = projectMap['devcollab-realtime-analytics-engine-a1b2'];
  const marcus = devMap['marcuschen'];
  const priya = devMap['priyasharma'];
  const elena = devMap['elenarostova'];
  const lucas = devMap['lucassilva'];

  await prisma.projectMembership.create({
    data: {
      projectId: analyticsProject.id,
      userId: marcus.id,
      role: 'MEMBER'
    }
  });

  await prisma.projectMembership.create({
    data: {
      projectId: analyticsProject.id,
      userId: priya.id,
      role: 'MEMBER'
    }
  });

  // Seed Join Requests for Analytics Project
  await prisma.joinRequest.create({
    data: {
      projectId: analyticsProject.id,
      applicantId: lucas.id,
      introductoryMessage: "Hi Alex! I would love to contribute to the frontend telemetry dashboard. I have experience with React and modern JavaScript.",
      status: 'PENDING'
    }
  });

  await prisma.joinRequest.create({
    data: {
      projectId: analyticsProject.id,
      applicantId: elena.id,
      introductoryMessage: "Hello! I can assist with calculating statistical throughput and regression modeling on telemetry data.",
      status: 'ACCEPTED',
      reviewedBy: devMap['alexrivera'].id,
      reviewedAt: new Date(),
      reviewNotes: "Welcome to the team Elena!"
    }
  });

  // Seed Join Request for SkillGraph
  const resumeProject = projectMap['skillgraph-developer-knowledge-graph-parser-c3d4'];
  await prisma.joinRequest.create({
    data: {
      projectId: resumeProject.id,
      applicantId: devMap['alexrivera'].id,
      introductoryMessage: "Elena, I have extensive React & full-stack experience and would love to build the frontend visualizer for parsed skill graphs.",
      status: 'PENDING'
    }
  });

  // 7. Seed Tasks for DevCollab Analytics Project
  const alex = devMap['alexrivera'];

  const sampleTasks = [
    {
      title: 'Architect Redis stream consumer for telemetry ingestion',
      description: 'Implement a durable consumer group in Node.js that reads real-time team events and batches metrics.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      creatorId: alex.id,
      assigneeId: priya.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Design interactive SVG task velocity chart component',
      description: 'Build a reusable React chart component with tooltips showing completed tasks per sprint.',
      status: 'DONE',
      priority: 'MEDIUM',
      creatorId: alex.id,
      assigneeId: marcus.id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Configure automated WebSocket reconnect strategy with exponential backoff',
      description: 'Handle socket drops gracefully and replay missed events on reconnection.',
      status: 'TODO',
      priority: 'URGENT',
      creatorId: alex.id,
      assigneeId: alex.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Security audit on Socket.IO room authorization',
      description: 'Verify that non-members cannot subscribe to private room broadcast streams.',
      status: 'IN_REVIEW',
      priority: 'HIGH',
      creatorId: priya.id,
      assigneeId: priya.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Write end-to-end integration tests for task board status transitions',
      description: 'Ensure Kanban drag-and-drop status mutations reflect across all connected clients.',
      status: 'TODO',
      priority: 'MEDIUM',
      creatorId: alex.id,
      assigneeId: null,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    }
  ];

  for (const t of sampleTasks) {
    await prisma.task.create({
      data: {
        ...t,
        projectId: analyticsProject.id
      }
    });

    await prisma.activityLog.create({
      data: {
        projectId: analyticsProject.id,
        actorId: t.creatorId,
        action: 'TASK_CREATED',
        entityType: 'TASK',
        metadata: JSON.stringify({ title: t.title, priority: t.priority })
      }
    });
  }

  // 8. Seed Milestones
  await prisma.milestone.create({
    data: {
      projectId: analyticsProject.id,
      creatorId: alex.id,
      title: 'M1: Core Telemetry Ingestion Pipeline',
      description: 'Working Redis pipeline with Node.js microservice processing at least 1,000 events/second.',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.milestone.create({
    data: {
      projectId: analyticsProject.id,
      creatorId: alex.id,
      title: 'M2: Interactive Visualization Dashboard',
      description: 'Complete UI workspace with team graphs, live activity feeds, and filtering.',
      status: 'UPCOMING',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  // 9. Seed Discussion Messages in Analytics Project
  await prisma.discussionMessage.create({
    data: {
      projectId: analyticsProject.id,
      senderId: alex.id,
      message: 'Welcome everyone to the DevCollab Analytics Engine workspace! Let us check the milestone roadmap.'
    }
  });

  await prisma.discussionMessage.create({
    data: {
      projectId: analyticsProject.id,
      senderId: priya.id,
      message: 'Excited to be here! I have started outlining the Redis stream consumer pipeline.'
    }
  });

  await prisma.discussionMessage.create({
    data: {
      projectId: analyticsProject.id,
      senderId: marcus.id,
      message: 'I finished the task velocity SVG chart mockups in Figma. Will begin integrating the React component today.'
    }
  });

  // 10. Seed Bookmarks
  await prisma.bookmark.create({
    data: {
      userId: alex.id,
      projectId: resumeProject.id
    }
  });

  await prisma.bookmark.create({
    data: {
      userId: lucas.id,
      projectId: analyticsProject.id
    }
  });

  // 11. Seed Admin Report
  await prisma.report.create({
    data: {
      reporterId: devMap['marcuschen'].id,
      targetType: 'PROJECT',
      projectId: resumeProject.id,
      reason: 'OTHER',
      explanation: 'Please verify the repository link permissions.',
      status: 'PENDING'
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
