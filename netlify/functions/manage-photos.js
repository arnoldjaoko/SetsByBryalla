const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { action, password, fileName, fileData } = JSON.parse(event.body);

    if (password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ message: "Incorrect Password" }) };
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = "arnoldjaoko";
    const repo = "SetsByBryalla";
    const path = `images/${fileName}`;

    if (action === "upload") {
      let sha;
      try {
        const existing = await octokit.repos.getContent({ owner, repo, path });
        sha = existing.data.sha;
      } catch (e) {
        // File does not exist yet
      }

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `Upload ${fileName} via Admin Portal`,
        content: fileData,
        sha: sha
      });

      return { statusCode: 200, body: JSON.stringify({ message: "Photo uploaded successfully!" }) };
    }

    if (action === "delete") {
      const existing = await octokit.repos.getContent({ owner, repo, path });
      await octokit.repos.deleteFile({
        owner,
        repo,
        path,
        message: `Delete ${fileName} via Admin Portal`,
        sha: existing.data.sha
      });

      return { statusCode: 200, body: JSON.stringify({ message: "Photo deleted successfully!" }) };
    }

    return { statusCode: 400, body: JSON.stringify({ message: "Invalid action" }) };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};
