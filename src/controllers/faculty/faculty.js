// route handlers for faculty list and detail pages

// import faculty model functions
import {getFacultyById, getSortedFaculty} from '../../models/faculty/faculty.js';

// faculty list page
const facultyListPage = (req, res) => {
    const sortBy = req.query.sort || 'name';
    const faculty = getSortedFaculty(sortBy);
    
    res.render('faculty/list', {
        title: 'Faculty Directory',
        faculty: faculty,
        currentSort: sortBy
    });
}

// Create a facultyDetailPage function that uses route parameters to look up individual faculty
const facultyDetailPage = (req, res, next) => {
    const facultyId = req.params.facultyId;
    const faculty = getFacultyById(facultyId);  

    // If faculty doesn't exist, create 404 error
    if (!faculty) {
        const err = new Error(`Faculty ${facultyId} not found`);
        err.status = 404;
        return next(err);
    }

    res.render('faculty/detail', {
        title: faculty.name,
        faculty: faculty
    });
}

export {facultyListPage, facultyDetailPage};