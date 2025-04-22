"use client"
import './page.css'
// import PlaceholdersAndVanishInput from"@/app/components/Inputform"
import Link from "next/link"
// import Iridescence from "./components/Iridescence";
export default function Home() {
  return (
    <div id="main_body">
      
      {/* <PlaceholdersAndVanishInput/> */}
      <div
        id="add_url"
        className="flex justify-center items-center w-14 h-14 rounded-full bg-pink-300 transition-all duration-300 absolute top-0 group-hover:scale-[.60] group-hover:origin-top text-white"
      >
        <span style={{color:"black",fontWeight:"900",fontSize:"20px!important",scale:"120%"}}>
          <Link href="/url" id="fic"><i className="fa-solid fa-link"></i></Link>
        </span>
      </div>
      
      <div
        id="add_pdf"
        className="flex justify-center items-center w-14 h-14 rounded-full bg-pink-300 transition-all duration-300 absolute top-0 group-hover:scale-[.60] group-hover:origin-top text-white"
      >
        <span style={{color:"black",fontWeight:"900",fontSize:"20px!important",scale:"120%"}}>
          <Link href="/pdf" id="fic"><i className="fa-solid fa-file"></i></Link>
        </span>
      </div>
      
      {/* ################### */}
      
      <div
        id="set_behaviour"
        className="flex justify-center items-center w-14 h-14 rounded-full bg-yellow-300 transition-all duration-300 absolute top-0 group-hover:scale-[.60] group-hover:origin-top text-white"
      >
        <span style={{color:"black",fontWeight:"900",fontSize:"20px!important",scale:"120%"}}>
          <Link href="/behaviour" id="fic"><i className="fa-solid fa-robot"></i></Link>
        </span>
      </div>
    </div>
  );
}
