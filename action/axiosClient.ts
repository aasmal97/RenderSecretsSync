import axios from "axios";
export const axiosClient = (RENDER_API_KEY: string ) => axios.create({
  baseURL: "https://api.render.com/v1",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${RENDER_API_KEY}`,
  },
});
