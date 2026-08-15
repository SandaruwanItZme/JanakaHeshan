const { collection, singleton } = require('./store');

const Profile = singleton('profile', {
  name: 'Janaka Heshan',
  title: 'Computer Hardware Technician & Web Developer',
  description:
    'Computer Hardware Technician & Web Developer based in Kegalle, Sri Lanka. Building resilient websites and repairing the machines that run them.',
  location: 'Kegalle, Sri Lanka',
  email: 'heshanmd.ml@gmail.com',
  phone: '',
  profileImage: '',
  resumeUrl: '',
  socialLinks: {
    github: 'https://github.com/janakaheshan',
    linkedin: 'https://linkedin.com/in/janakaheshan',
    discord: '',
  },
});

const About = singleton('about', {
  title: "Two crafts, one obsession: things that work.",
  description: '',
  stats: [],
  highlights: [],
});

const Skills = collection('skills'); // { id, name, category, level, icon }
const Projects = collection('projects'); // { id, title, description, image, technologies[], githubUrl, liveUrl, featured, category }
const Experience = collection('experience'); // { id, company, position, description, startDate, endDate, current }
const Education = collection('education'); // { id, institution, course, description, startDate, endDate }
const Messages = collection('messages'); // { id, name, email, phone, message, status, discordSent }
const ActivityLog = collection('activity'); // { id, action, user, ip, result }
const Users = collection('users'); // { id, username, passwordHash }
const AnalyticsEvents = collection('analytics_events'); // { id, path, referrer, ua, device, browser, os, ts }

const Settings = singleton('settings', {
  siteTitle: 'Janaka Heshan — Digital Artisan',
  siteDescription: 'Computer Hardware Technician & Web Developer, Sri Lanka',
  logoUrl: '',
  faviconUrl: 'assets/icons/favicon.svg',
  authorName: 'Janaka Heshan',
  contactEmail: 'heshanmd.ml@gmail.com',
  contactPhone: '',
  maintenanceMode: false,
  contactFormEnabled: true,
  discordNotificationsEnabled: true,
  analyticsEnabled: true,
  showProjects: true,
  showSocialLinks: true,
  showResumeButton: true,
  theme: 'system', // dark | light | system
  accentColor: '#c77b3c',
  animationIntensity: 'normal', // low | normal | high
});

module.exports = {
  Profile,
  About,
  Skills,
  Projects,
  Experience,
  Education,
  Messages,
  ActivityLog,
  Users,
  AnalyticsEvents,
  Settings,
};
