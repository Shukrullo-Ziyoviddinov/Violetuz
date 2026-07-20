const { Router } = require('express');
const healthRoutes = require('./health.routes');
const movieRoutes = require('./movie.routes');
const movieSectionRoutes = require('./movieSection.routes');
const musicRoutes = require('./music.routes');
const musicSectionRoutes = require('./musicSection.routes');
const albumRoutes = require('./album.routes');
const clipRoutes = require('./clip.routes');
const clipSectionRoutes = require('./clipSection.routes');
const concertRoutes = require('./concert.routes');
const concertSectionRoutes = require('./concertSection.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/movies', movieRoutes);
router.use('/movie-sections', movieSectionRoutes);
router.use('/music', musicRoutes);
router.use('/music-sections', musicSectionRoutes);
router.use('/albums', albumRoutes);
router.use('/clips', clipRoutes);
router.use('/clip-sections', clipSectionRoutes);
router.use('/concerts', concertRoutes);
router.use('/concert-sections', concertSectionRoutes);

module.exports = router;
