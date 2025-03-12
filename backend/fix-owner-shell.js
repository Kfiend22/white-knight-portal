// fix-owner-shell.js
// MongoDB shell script to fix the owner user role

// To run this script:
// 1. Open a terminal
// 2. Connect to MongoDB shell: mongo
// 3. Switch to the database: use white-knight-portal
// 4. Load and run this script: load("backend/fix-owner-shell.js")

// Update the owner user
db.users.updateOne(
  { username: "owner" },
  {
    $set: {
      primaryRole: "OW",
      role: "OW",
      "secondaryRoles.admin": true,
      permissions: {
        pages: [
          "Dashboard",
          "Submissions",
          "Regions",
          "Settings",
          "Payments",
          "Users",
          "Performance"
        ],
        actions: [
          "create_user",
          "edit_user",
          "delete_user",
          "create_job",
          "edit_job",
          "delete_job",
          "assign_job",
          "view_reports",
          "manage_settings",
          "manage_regions"
        ]
      }
    },
    $push: {
      auditLog: {
        action: "fix-owner-role",
        timestamp: new Date(),
        details: {
          method: "fix-owner-shell.js",
          changes: "Fixed owner role and permissions"
        }
      }
    }
  }
);

// Verify the update
printjson(db.users.findOne({ username: "owner" }));
