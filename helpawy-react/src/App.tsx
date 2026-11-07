import {Route,Routes} from "react-router-dom";
import {Guard,Layout} from "./components/Layout";
import {About,Community,EventPage,Home,ListPage,SearchPage} from "./pages/Public";
import {AuthForm,Forgot,Onboarding,Reset} from "./pages/Auth";
import {AIPage,Dashboard,Journey,Notifications,Profile,Recs} from "./pages/Member";
import {Admin} from "./pages/Admin";
export default function App(){
  return <Routes><Route element={<Layout/>}>
    <Route index element={<Home/>}/><Route path="about" element={<About/>}/>
    <Route path="services" element={<ListPage kind="s"/>}/><Route path="experts" element={<ListPage kind="x"/>}/>
    <Route path="events" element={<ListPage kind="e"/>}/><Route path="event/:id" element={<EventPage/>}/><Route path="resources" element={<ListPage kind="r"/>}/>
    <Route path="community" element={<Community/>}/><Route path="search" element={<SearchPage/>}/><Route path="forgot" element={<Forgot/>}/><Route path="reset" element={<Reset/>}/><Route path="login" element={<AuthForm mode="login"/>}/><Route path="signup" element={<AuthForm mode="signup"/>}/>
    <Route element={<Guard/>}><Route path="onboarding" element={<Onboarding/>}/><Route path="dashboard" element={<Dashboard/>}/><Route path="journey" element={<Journey/>}/><Route path="recs" element={<Recs/>}/><Route path="ai" element={<AIPage/>}/><Route path="notifications" element={<Notifications/>}/><Route path="profile" element={<Profile/>}/></Route>
    <Route element={<Guard role="admin"/>}><Route path="admin" element={<Admin/>}/></Route>
    <Route path="*" element={<Home/>}/></Route></Routes>;
}
