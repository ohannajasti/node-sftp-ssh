import SftpClient from "ssh2-sftp-client";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const sftpConfig = {
    host: process.env.SFTP_HOST || '192.168.1.100',
    port: parseInt(process.env.SFTP_PORT || '22'), // Ensure port is a number
    username: process.env.SFTP_USERNAME || 'test',
    password: process.env.SFTP_PASSWORD || 'test',
    // For production, consider using privateKey instead of password for stronger security
    // privateKey: require('fs').readFileSync('/path/to/your/private_key'),
    // passphrase: 'your_private_key_passphrase', // if your private key is encrypted
};

async function runSftpOperations() {
    const sftp = new SftpClient();

    try {
        console.log('✨ Connecting to SFTP server...');
        await sftp.connect(sftpConfig);
        console.log('✅ Connected to SFTP server!');

        const remoteDir = '/test_sftp_dir'; // A directory on the SFTP server
        const localFilePath = path.join(__dirname, 'local_file.txt');
        const remoteFilePath = path.join(remoteDir, 'uploaded_file.txt');
        const downloadedFilePath = path.join(__dirname, 'downloaded_file.txt');

        // --- Create a local dummy file for upload ---
        await fs.writeFile(localFilePath, 'Hello from Node.js SFTP client!');
        console.log(`Created local file: ${localFilePath}`);

        // --- Check if remote directory exists and create if not ---
        console.log(`Checking if remote directory "${remoteDir}" exists...`);
        const dirExists = await sftp.exists(remoteDir);
        if (!dirExists) {
            console.log(`Remote directory "${remoteDir}" does not exist. Creating...`);
            await sftp.mkdir(remoteDir, true); // `true` for recursive creation
            console.log(`Created remote directory: ${remoteDir}`);
        } else {
            console.log(`Remote directory "${remoteDir}" already exists.`);
        }

        // --- Upload a file ---
        console.log(`⬆️ Uploading ${localFilePath} to ${remoteFilePath}...`);
        await sftp.put(localFilePath, remoteFilePath);
        console.log('✅ File uploaded successfully!');

        // --- List files in a directory ---
        console.log(`\n📂 Listing files in ${remoteDir}:`);
        const list = await sftp.list(remoteDir);
        list.forEach(item => {
            console.log(`- ${item.type === 'd' ? 'Directory' : 'File'}: ${item.name} (Size: ${item.size} bytes)`);
        });

        // --- Download a file ---
        console.log(`\n⬇️ Downloading ${remoteFilePath} to ${downloadedFilePath}...`);
        await sftp.get(remoteFilePath, downloadedFilePath);
        console.log('✅ File downloaded successfully!');

        // --- Read content of the downloaded file ---
        const downloadedContent = await fs.readFile(downloadedFilePath, 'utf8');
        console.log(`Content of downloaded file:\n"${downloadedContent}"`);

        // --- Delete the uploaded file (optional) ---
        console.log(`\n🗑️ Deleting remote file: ${remoteFilePath}...`);
        await sftp.delete(remoteFilePath);
        console.log('✅ Remote file deleted successfully!');

        // --- Delete the remote directory (optional) ---
        console.log(`\n🗑️ Deleting remote directory: ${remoteDir}...`);
        await sftp.rmdir(remoteDir); // Careful with recursive deletion; default is non-recursive
        console.log('✅ Remote directory deleted successfully!');

    } catch (err) {
        console.error('❌ SFTP Error:', err.message);
    } finally {
        console.log('👋 Ending SFTP connection...');
        await sftp.end();
        console.log('✅ SFTP connection ended.');

        // --- Clean up local dummy files ---
        try {
            await fs.unlink(localFilePath);
            await fs.unlink(downloadedFilePath);
            console.log('Cleaned up local dummy files.');
        } catch (cleanupErr) {
            console.warn('Could not clean up local dummy files:', cleanupErr.message);
        }
    }
}

runSftpOperations();