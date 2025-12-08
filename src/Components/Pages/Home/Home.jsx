// src/Components/Pages/Home/Home.jsx
import React from "react";
import "./Home.css";
import Header from "../../Header/Header";

import comic1 from "../../Assets/comic1.png";
import comic2 from "../../Assets/comic2.png";
import comic3 from "../../Assets/comic3.png";

const comics = [
  { id: 1, title: "1776 (2025) #1", brand: "Marvel",   img: comic1 },
  { id: 2, title: "Captain America (2018)",  brand: "Marvel",   img: comic2 },
  { id: 3, title: "Spider-Man & Wolverine (2025) #6",  brand: "Marvel",img: comic3 },
];

export default function Home() {
  return (
    <main className="home">
      {/* HERO / Banner */}
      <Header />

      {/* COMICS SECTION */}
      <section className="comics-section">
        <h2>Just Added</h2>
        <div className="comics-grid">
          {comics.map((c) => (
            <div className="comic-card" key={c.id}>
              <img src={c.img} alt={c.title} />
              <h3>{c.title}</h3>
              <p>{c.brand}</p>
              <button>Purchase</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
