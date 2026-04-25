const db = require('../knex');

const trackerQueries = {
  create: async (data) => {
    const [record] = await db('tracker_applications').insert(data).returning('*');
    return record;
  },

  findByUserId: async (user_id) => {
    return db('tracker_applications')
      .leftJoin('resumes', 'tracker_applications.resume_id', 'resumes.id')
      .where('tracker_applications.user_id', user_id)
      .select(
        'tracker_applications.id',
        'tracker_applications.company_name',
        'tracker_applications.job_id',
        'tracker_applications.created_at',
        'tracker_applications.resume_id',
        'resumes.title as resume_title',
        'resumes.pdf_path as resume_pdf_path' // For easy viewing
      )
      .orderBy('tracker_applications.created_at', 'desc');
  },

  delete: async (id, user_id) => {
    return db('tracker_applications')
      .where({ id, user_id })
      .del();
  }
};

module.exports = trackerQueries;
