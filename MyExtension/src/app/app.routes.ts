import { Routes } from '@angular/router';
// import { LoginComponent } from './login/';
import { RegisterComponent } from './register/register.component';
import { AdminDashboardComponent } from './admindashboard/admindashboard.component';
import { UserDashboardComponent } from './userdeshbaord/userdeshbaord.component';
import { LoginComponent } from './login/login.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { UserHistoryComponent } from './user-history/user-history.component';
import { Component } from '@angular/core';
import { AdmintaskviewComponent } from './admintaskview/admintaskview.component';
import { ProjectComponent } from './projects/projects.component';



export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'register',
        component: RegisterComponent
    }
    ,
    {
        path: 'admindashboard',
        component: AdminDashboardComponent
    }

    ,
    {
        path: 'userdashboard',
        component: UserDashboardComponent
    }
    ,
    {
        path: 'user-details/:id',
        component: UserDetailsComponent

    },

    {
        path: "user-history",
        component: UserHistoryComponent
    },


    {
        path: 'admintaskview',
        component: AdmintaskviewComponent
    },

    {
        path: "project",
        component: ProjectComponent
    }

];
