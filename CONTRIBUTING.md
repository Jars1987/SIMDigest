# Contributing to SIMD Digest

Thank you for your interest in contributing to SIMD Digest! This document provides guidelines and information for contributors.

---

## 🌟 Ways to Contribute

### 🐛 Report Bugs
- Check [existing issues](https://github.com/Jars1987/SIMDigest/issues) first
- Use the bug report template
- Include steps to reproduce
- Provide error messages and logs (remove any sensitive data)

### 💡 Suggest Features
- Open an issue with the "enhancement" label
- Describe the use case
- Explain how it benefits the community
- Consider implementation complexity

### 📝 Improve Documentation
- Fix typos and clarify instructions
- Add examples and use cases
- Update outdated information
- Translate to other languages

### 🔧 Submit Code
- Fix bugs
- Add features
- Improve performance
- Refactor code

---

## 🚀 Getting Started

### 1. Fork & Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/SIMDigest.git
cd SIMDigest
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your credentials in .env

# Create database tables
npm run setup:db

# Setup admin account
npm run admin:setup
npm run admin:add -- your-email@example.com

# Sync initial data
npm run sync:proposals
npm run sync:prs
npm run generate:summaries

# Start development server
npm run dev
```

### 3. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bug fix branch
git checkout -b fix/bug-description
```

---

## 📋 Development Guidelines

### Code Style

- **TypeScript** - Use TypeScript for all new code
- **ESLint** - Run `npm run lint` before committing
- **Formatting** - Use consistent indentation (2 spaces)
- **Naming** - Use descriptive variable and function names

### Best Practices

1. **Type Safety**
   - Define TypeScript interfaces for all data structures
   - Avoid `any` types
   - Use strict null checks

2. **Component Structure**
   - Keep components small and focused
   - Extract reusable logic into hooks
   - Use composition over inheritance

3. **Error Handling**
   - Always handle errors gracefully
   - Log errors with context
   - Never expose sensitive data in errors
   - Provide user-friendly error messages

4. **Security**
   - Never commit secrets or API keys
   - Use environment variables for credentials
   - Validate all user input
   - Sanitize data before database operations
   - Use parameterized queries (no string concatenation)

5. **Performance**
   - Optimize database queries
   - Use pagination for large datasets
   - Implement caching where appropriate
   - Avoid unnecessary re-renders

### File Organization

```
app/           # Next.js routes and pages
components/    # React components
lib/           # Utilities and helpers
scripts/       # CLI and sync scripts
types/         # TypeScript definitions
database/      # SQL schemas
```

---

## 🧪 Testing

### Before Submitting

1. **Test Your Changes**
   ```bash
   npm run build        # Verify build succeeds
   npm run lint         # Check for linting errors
   ```

2. **Test Core Functionality**
   - Login/logout flows
   - Newsletter creation
   - SIMD viewing
   - Data syncing

3. **Test Edge Cases**
   - Empty states
   - Error conditions
   - Invalid inputs
   - Rate limiting

### Manual Testing Checklist

- [ ] Feature works as expected
- [ ] No console errors
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] No security vulnerabilities introduced
- [ ] Environment variables documented in .env.example

---

## 📝 Commit Guidelines

### Commit Message Format

```
type(scope): brief description

Longer description if needed

Fixes #123
```

### Commit Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Examples

```bash
feat(newsletter): add rich text editor support

fix(auth): resolve rate limiting bypass vulnerability

docs(readme): update installation instructions

refactor(queries): optimize SIMD fetching performance
```

---

## 🔄 Pull Request Process

### 1. Prepare Your PR

```bash
# Sync with main branch
git checkout main
git pull upstream main

# Rebase your feature branch
git checkout feature/your-feature
git rebase main

# Push to your fork
git push origin feature/your-feature
```

### 2. Create Pull Request

- Use a clear, descriptive title
- Reference related issues
- Describe what changed and why
- Include screenshots for UI changes
- List breaking changes (if any)

### 3. PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How were these changes tested?

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tested on multiple browsers (if UI change)
```

### 4. Code Review

- Be responsive to feedback
- Make requested changes promptly
- Ask questions if unclear
- Be respectful and professional

### 5. Merging

- Maintainers will merge approved PRs
- Squash commits if necessary
- Delete branch after merge

---

## 🔐 Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email security concerns to: joserelvassantos@gmail.com
2. Include detailed description
3. Provide steps to reproduce
4. Wait for response before public disclosure

### Security Best Practices

- Never commit `.env` files
- Use environment variables for all secrets
- Validate and sanitize all inputs
- Use parameterized database queries
- Implement rate limiting on sensitive endpoints
- Keep dependencies updated
- Follow OWASP guidelines

---

## 🎨 UI/UX Guidelines

### Design Principles

- **Solana Brand Colors** - Use official gradient (purple, green, blue)
- **Mobile First** - Design for mobile, enhance for desktop
- **Accessibility** - WCAG 2.1 AA compliance
- **Performance** - Fast load times, smooth interactions
- **Consistency** - Follow existing patterns

### Component Guidelines

- Use Tailwind CSS classes
- Maintain responsive design
- Add loading states
- Handle error states
- Provide feedback for user actions

---

## 📚 Resources

### Project Documentation

- [Getting Started Guide](./docs/GETTING_STARTED.md)
- [Admin Setup](./docs/ADMIN_SETUP_GUIDE.md)
- [Newsletter Workflow](./docs/NEWSLETTER_WORKFLOW_GUIDE.md)
- [Deployment Guide](./docs/VERCEL_DEPLOYMENT_GUIDE.md)
- [Security Audit](./docs/SECURITY_AUDIT.md)

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [GitHub API](https://docs.github.com/en/rest)
- [OpenAI API](https://platform.openai.com/docs)

---

## 💬 Communication

### Where to Ask Questions

- **GitHub Discussions** - General questions, feature ideas
- **GitHub Issues** - Bug reports, specific problems
- **X (Twitter)** - [@Joserelvassant1](https://x.com/Joserelvassant1)

### Response Times

- Issues: Within 48 hours
- Pull requests: Within 1 week
- Security reports: Within 24 hours

---

## 🏆 Recognition

### Contributors

All contributors will be recognized in:
- README.md acknowledgments section
- Release notes
- Project documentation

### Types of Contributions Valued

- Code contributions
- Documentation improvements
- Bug reports
- Feature suggestions
- Community support
- Translations
- Design improvements

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Age, body size, disability
- Ethnicity, gender identity
- Experience level
- Nationality, personal appearance
- Race, religion
- Sexual identity and orientation

### Expected Behavior

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Unprofessional conduct

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report violations to: joserelvassantos@gmail.com

---

## 🎯 Development Priorities

### Current Focus

1. **Stability** - Bug fixes and reliability
2. **Security** - Ongoing security improvements
3. **Performance** - Optimization and caching
4. **Documentation** - Keep guides up-to-date

### Future Roadmap

- [ ] Email service integration (Resend)
- [ ] Advanced filtering and search
- [ ] User preferences and notifications
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations
- [ ] Internationalization (i18n)

---

## 💝 Support the Project

If you can't contribute code, you can still help:

- ⭐ Star the repository
- 📢 Share on social media
- 📝 Write blog posts or tutorials
- 💰 [Donate](README.md#-support-this-project) to cover operational costs

**Solana Address:** `NbtprKrcGxbHBEK8dCQTnSdYEd2cxQaEEkrLmMbMvpF`

---

## ✨ Thank You!

Every contribution, no matter how small, makes SIMD Digest better for the entire Solana community!

**Happy contributing!** 🚀

---

<div align="center">
  <p>Made with 💜 by the community</p>
  <p><strong>Building the future of Solana governance tracking</strong></p>
</div>
