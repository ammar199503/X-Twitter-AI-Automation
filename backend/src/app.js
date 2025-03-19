import authRoutes from './routes/auth.js';
import statusRoutes from './routes/status.js';
import scrapeRoutes from './routes/scrape.js';
import configRoutes from './routes/config.js';
import targetAccountsRoutes from './routes/targetAccounts.js';
import logsRoutes from './routes/logs.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/scrape', scrapeRoutes);
app.use('/api/config', configRoutes);
app.use('/api/target-accounts', targetAccountsRoutes);
app.use('/api/logs', logsRoutes); 