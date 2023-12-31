const capability = require("./schemas/capability.js");

const cababilitiesByRole = {
  // master: {
  //   company: {
  //     applicants: capability,
  //     job_posting: capability,
  //     my_company: capability,
  //     internships: capability,
  //   },
  //   school: {
  //     schools_partners: capability,
  //     my_school: capability,
  //   },
  // },
  recruiter: {},
  student: {
    company: {
      my_company: {
        access: true,
      },
    },
  },
  educational_coordinator: {},
};

module.exports.cababilitiesByRole = cababilitiesByRole;

function getCababilitiesByRole(role) {
  const capabilities = cababilitiesByRole[role];
  if (typeof capabilities === "undefined") {
    return {};
  } else {
    return capabilities;
  }
}

module.exports.getCababilitiesByRole = getCababilitiesByRole;
