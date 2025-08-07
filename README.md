# node-sftp-ssh

podman pull atmoz/sftp

podman run --platform linux/amd64 -p 2222:22 -v /Users/jasti.ohanna/sftp_data:/home/foo/upload -d atmoz/sftp foo:pass:::upload