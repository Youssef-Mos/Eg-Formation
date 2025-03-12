'use client';

import React, { Component } from 'react'
import { Button } from './ui/button';

export class Nav extends Component {
  render() {
    return (
      <div className="fixed top-0 left-0 right-0 flex justify-center mt-10">
        {/* Conteneur de la bordure animée */}
        
          {/* Contenu de la nav avec fond uni */}
          <ul className="bg-zinc-800 flex justify-center gap-5 items-center w-sm px-5 py-3 rounded-3xl text-zinc-100 font-semibold ">
            <li className="cursor-pointer px-2.5 py-2 hover:bg-zinc-600 rounded-2xl transition-all duration-200 ease-in hover:bg-gradient-to-tr  from-zinc-700 via-stone-100 to-zinc-800 animate-gradient-fast">Logo</li>
            <li>Home</li>
            <li>About</li>
            <li>Contact</li>
          </ul>
       
      </div>
    )
  }
}

export default Nav

