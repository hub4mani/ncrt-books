import { Component, HostListener, Injectable, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input'; 
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';
// Import AppPdfViewerComponent here, but don't add it to imports array
import { AppPdfViewerComponent } from './app-pdf-viewer/app-pdf-viewer.component'; 
import { MarkdownModule } from 'ngx-markdown';
import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login'
import { SocialAuthService, SocialUser } from "@abacritt/angularx-social-login";
import { GoogleLoginProvider } from "@abacritt/angularx-social-login";


interface Grade {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  grade_id: number;
}

interface Lesson {
  id: number;
  name: string;
  subject_id: number;
  github_url: string;
  lesson_number: string;
  lesson_title: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    PdfViewerModule, 
    MarkdownModule,
    AppPdfViewerComponent,
    GoogleSigninButtonModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
@Injectable({ providedIn: 'root' })
export class AppComponent implements OnInit {
  title = 'Lesson Q&A';
  grades: Grade[] = [];
  subjects: Subject[] = [];
  lessons: Lesson[] = [];

  selectedGrade: Grade | null = null;
  selectedSubject: Subject | null = null;
  selectedLesson: Lesson | null = null;
  
  pdfSrc: any = null;
  chatMessages: { text: string, isUser: boolean }[] = [];
  userQuestion: string = '';
  chatId: string | null = null; // To store the chat ID
  chatStarted: boolean = false;
  titleUpdateInProgress: boolean = false;

  user: SocialUser | null = null; 
  loggedIn: boolean = false;
  userFeedback: string = '';
  

  constructor(private http: HttpClient, private authService: SocialAuthService) {}

  ngOnInit() {
    this.fetchGrades();
    // Check login status
    if (localStorage.getItem('isLoggedIn') === 'true') {
      this.loggedIn = true;
    }
    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = (user != null);
      if (user) {
        this.logUserActivity('login'); // Log login activity
      }
    });
  }

  signInWithGoogle(): void {
    this.authService.signIn(GoogleLoginProvider.PROVIDER_ID, {
      scopes: 'profile email openid https://www.googleapis.com/auth/userinfo.profile' 
    }).then(user => {
        console.log(user.authToken); // Check if the token is available
        localStorage.setItem('isLoggedIn', 'true'); // Store login status
    });
  }

  signOut(): void {
    this.logUserActivity('logout');
    this.authService.signOut();
    localStorage.removeItem('isLoggedIn');
  }

  private logUserActivity(activityType: string): void {
    if (this.user) { // Ensure user is logged in
      console.log(this.user)
      const activityData = {
        username: this.user.firstName + ' ' + this.user.lastName,
        email: this.user.email,
        activity_type: activityType
      };

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.user.authToken}`
      });

      this.http.post(
        'https://ai-gateway-serv-178678790881.asia-south1.run.app/lesson-data/user_activity', 
        activityData,
        { headers: headers }
      ).subscribe(
        response => {
          console.log('User activity logged successfully:', response);
        },
        error => {
          console.error('Error logging user activity:', error);
        }
      );
    }
  }

  submitFeedback() {
    if (this.user && this.userFeedback) {
      const feedbackData = {
        email: this.user.email,
        feedback: this.userFeedback
      };

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.user.authToken}`
      });

      this.http.post(
        'https://ai-gateway-serv-178678790881.asia-south1.run.app/lesson-data/user_feedback',
        feedbackData,
        { headers: headers }
      ).subscribe(
        response => {
          console.log('Feedback submitted successfully:', response);
          // Optionally, you can display a success message to the user
          this.userFeedback = ''; // Clear the feedback field
        },
        error => {
          console.error('Error submitting feedback:', error);
          // Optionally, you can display an error message to the user
        }
      );
    }
  }

  fetchGrades() {
    this.http.get<Grade[]>(
      `https://ai-gateway-serv-178678790881.asia-south1.run.app/lesson-data/grades`
    )
      .subscribe(data => {
        this.grades = data; 
      });
  }

  fetchSubjects(gradeId: number | undefined) {
    if (gradeId !== undefined) { 
      this.http.get<Subject[]>(
        `https://ai-gateway-serv-178678790881.asia-south1.run.app/lesson-data/subjects?grade_id=${gradeId.toString()}`
      ) 
        .subscribe(data => {
          this.subjects = data; 
        });
    } else {
      this.subjects = [];
    }
  }

  fetchLessons(subjectId: number | undefined) {
    if (subjectId !== undefined) {
      this.http.get<Lesson[]>(
        `https://ai-gateway-serv-178678790881.asia-south1.run.app/lesson-data/lessons?subject_id=${subjectId.toString()}`
      ) 
        .subscribe(data => {
          this.lessons = data;
        });
    } else {
      this.lessons = []; 
    }
  }

  loadLesson() {
    if (this.selectedLesson) {
      const pdfUrl = this.selectedLesson.github_url;
      const filePath = pdfUrl.replace('https://raw.githubusercontent.com/hub4mani/ncrt-books/main/', '');
      this.pdfSrc = filePath.lstrip('public/');

      console.log('PDF Src wihtout public = ' + this.pdfSrc);

      // Start the chat session
      this.http.post(
        'https://ai-gateway-serv-178678790881.asia-south1.run.app/doc-ai/start_chat',
        { pdf_url: this.selectedLesson.github_url }
      )
        .subscribe({
          next: (response: any) => {
            this.chatId = response.chat_id; 
            console.log('Chat session started:', this.chatId);
            this.chatStarted = true;
          },
          error: (error) => {
            console.error('Error starting chat:', error); 
          }
        });
    }
  }

  askQuestion() {
    if (this.chatId && this.userQuestion) { // Check if chatId is available
      this.chatMessages.push({ text: this.userQuestion, isUser: true });
      const question = this.userQuestion;
      this.userQuestion = '';

      // Send the chat query
      this.http.post(
          'https://ai-gateway-serv-178678790881.asia-south1.run.app/doc-ai/chat',
          { 
            chat_id: this.chatId,
            query: question,
          }
        )
        .subscribe((response: any) => {
          this.chatMessages.push({ text: response.answer, isUser: false });
        });
    } else {
      console.error('Chat session not started.'); 
    }
  }

  endChat() {
    if (this.chatId) {
      this.http.post(
        'https://ai-gateway-serv-178678790881.asia-south1.run.app/doc-ai/end_chat',
        { 
          chat_id: this.chatId,
          query: '',
        }
      )
      .subscribe({
        next: (response) => {
          this.chatMessages = [];
          this.chatId = null;
          this.chatStarted = false;
        },
        error: (error) => {
          console.error('Error ending chat:', error); // Log the error for debugging
          this.chatStarted = false; // Ensure chatStarted is false even on error
          // Optionally, you can display an error message to the user here
        },
        complete: () => {
          // This block is optional and executes after both success and error
        }
      });
    }
  }

  @HostListener('document:keydown.enter', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.chatStarted) {
      this.askQuestion();
    }
  }

  lessonNumberStartsWithAlphabet(lessonNumber: string | undefined): boolean {
    if (lessonNumber === undefined) {
      return false; 
    }
    return /^[a-zA-Z]/.test(lessonNumber);
  }

  updateLessonTitle() {
    if (this.selectedLesson) { // Ensure a lesson is selected
      const lessonId = this.selectedLesson.id; 
      const url = `https://ai-gateway-serv-178678790881.asia-south1.run.app/lesson-data/lessons/${lessonId}`;

      this.titleUpdateInProgress = true;
      
      this.http.put(url, {
        lesson_number: this.selectedLesson.lesson_number, // Use the updated values
        name: this.selectedLesson.name                  // Use the updated values
      }, {
        headers: { 'Content-Type': 'application/json' }
      })
        .subscribe(
          response => {
            console.log('Lesson title updated successfully:', response);
            this.titleUpdateInProgress = false;
          },
          error => {
            console.error('Error updating lesson title:', error);
            this.titleUpdateInProgress = false;
          }
        );
    }
  }
}
