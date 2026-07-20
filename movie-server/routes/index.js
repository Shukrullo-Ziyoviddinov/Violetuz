const { Router } = require('express');
const healthRoutes = require('./health.routes');
const movieRoutes = require('./movie.routes');
const movieSectionRoutes = require('./movieSection.routes');
const musicRoutes = require('./music.routes');
const musicSectionRoutes = require('./musicSection.routes');
const albumRoutes = require('./album.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/movies', movieRoutes);
router.use('/movie-sections', movieSectionRoutes);
router.use('/music', musicRoutes);
router.use('/music-sections', musicSectionRoutes);
router.use('/albums', albumRoutes);

module.exports = router;
