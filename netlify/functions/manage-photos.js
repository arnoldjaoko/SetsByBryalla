exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ message: "Method Not Allowed" }) };
  }

  try {
    const { action, password, fileName, fileData } = JSON.parse(event.body || "{}");

    // 1. Check Password
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ message: "Incorrect password. Please try again." }) 
      };
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ message: "Missing GITHUB_TOKEN in Netlify Environment Variables." }) 
      };
    }

    const owner = "arnoldjaoko";
    const repo = "SetsByBryalla";
    const path = `images/${fileName}`;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "Netlify-Admin-Portal",
      Accept: "application/vnd.github.v3+json"
    };

    // 2. Handle UPLOAD Action
    if (action === "upload") {
      let sha = undefined;
      
      // Check if file already exists to get SHA
      const getRes = await fetch(url, { headers });
      if (getRes.ok) {
        const existingData = await getRes.json();
        sha = existingData.sha;
      }

      const putRes = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Upload ${fileName} via Admin Portal`,
          content: fileData,
          sha: sha
        })
      });

      if (!putRes.ok) {
        const errData = await putRes.json();
        return { 
          statusCode: putRes.status, 
          body: JSON.stringify({ message: `GitHub Error: ${errData.message || "Upload failed"}` }) 
        };
      }

      return { 
        statusCode: 200, 
        body: JSON.stringify({ message: "Photo uploaded successfully!" }) 
      };
    }

    // 3. Handle DELETE Action
    if (action === "delete") {
      const getRes = await fetch(url, { headers });
      if (!getRes.ok) {
        return { 
          statusCode: 404, 
          body: JSON.stringify({ message: "File not found on GitHub." }) 
        };
      }
      const existingData = await getRes.json();

      const delRes = await fetch(url, {
        method: "DELETE",
        headers,
        body: JSON.stringify({
          message: `Delete ${fileName} via Admin Portal`,
          sha: existingData.sha
        })
      });

      if (!delRes.ok) {
        const errData = await delRes.json();
        return { 
          statusCode: delRes.status, 
          body: JSON.stringify({ message: `GitHub Error: ${errData.message || "Delete failed"}` }) 
        };
      }

      return { 
        statusCode: 200, 
        body: JSON.stringify({ message: "Photo deleted successfully!" }) 
      };
    }

    return { 
      statusCode: 400, 
      body: JSON.stringify({ message: "Invalid action request." }) 
    };

  } catch (error) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: `Server Error: ${error.message}` }) 
    };
  }
};
