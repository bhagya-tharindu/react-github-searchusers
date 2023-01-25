import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubuser, setgithubuser] = useState(mockUser);
  const [repos, setrepos] = useState(mockRepos);
  const [followers, setfollowers] = useState(mockFollowers);
  const [requests, setrequests] = useState(0);
  const [loading, setloading] = useState(false);
  const [error, seterror] = useState({ show: false, msg: "" });

  const checkrequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        setrequests(remaining);
        if (remaining === 0) {
          toggleerror(true, "sorry you have run out of hourly requests");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const toggleerror = (show = false, msg = "") => {
    seterror({ show, msg });
  };
  const Searchgithubuser = async (user) => {
    toggleerror();
    setloading(true);
    const resp = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (resp) {
      setgithubuser(resp.data);
      const { login, followers_url } = resp.data;
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        await axios(`${followers_url}?per_page=100`),
      ]).then((results) => {
        const [repos, followers] = results;
        const status = "fulfilled";
        if (repos.status === "fulfilled") {
          setrepos(repos.value.data);
        }
        if (followers.status === "fulfilled") {
          setfollowers(followers.value.data);
        }
      });
    } else {
      toggleerror(true, "sorry no user matched your search");
    }
    checkrequests();
    setloading(false);
  };
  useEffect(checkrequests, []);
  return (
    <GithubContext.Provider
      value={{
        githubuser,
        repos,
        followers,
        requests,
        error,
        loading,
        Searchgithubuser,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubContext, GithubProvider };
