# Identity Service

This is the **Identity Service** of the Xynapse microservices platform.  
It handles authentication, authorization, and user management.

## Docker Build

To build the Docker image for the Identity Service, run the following command **from the root of the monorepo**:

```bash
docker build -t identity-service -f apps/identity-service/Dockerfile .