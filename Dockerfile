FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Build estático para staging. Vite fija las variables VITE_* en el build, no al
# arrancar el contenedor: por eso llegan como build args.
FROM deps AS build

ARG VITE_API_URL

COPY . .
RUN npm run build

FROM nginx:1.30-alpine AS prod

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Última etapa = target por defecto: el servidor de desarrollo que usa el compose
# local, con VITE_API_URL tomada del .env al arrancar.
FROM deps AS dev

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
