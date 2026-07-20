const { Router } = require('express');
const healthRoutes = require('./health.routes');
const movieRoutes = require('./movie.routes');
const movieSectionRoutes = require('./movieSection.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/movies', movieRoutes);
router.use('/movie-sections', movieSectionRoutes);

module.exports = router;
