'use client';

import React, { Component } from 'react'
import { Button } from './ui/button';

export class Nav extends Component {
  render() {
    return (
      <div>
        <ul className='bg-zinc-800 mt-10 m-auto flex justify-end gap-5 items-center w-sm px-5 py-3 fixed top-0 left-0 right-0 rounded-3xl text-zinc-100 font-semibold shadow-lg shadow-zinc-500' >
            <li className='cursor-pointer px-2.5 py-2 hover:bg-zinc-600 rounded-2xl shadow-2xs transition-all duration-200 ease-in'>Logo</li>
            <li>Home</li>
            <li>About</li>
            <li>Contact</li>
        </ul>
        <Button variant="destructive" >sign-up</Button>
      </div>
    )
  }
}

export default Nav
