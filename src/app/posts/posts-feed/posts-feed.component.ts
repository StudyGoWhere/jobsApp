import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgForm, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { Post } from '../post.model';
import { PostsService } from '../post.service';
import { AuthService } from 'src/app/auth/auth.service';
import { AppliedBeforeDialog } from 'src/app/dialogs/applied-before-dialog/applied-before-dialog.component';
import { ReportedBeforeDialog } from 'src/app/dialogs/reported-before-dialog/reported-before-dialog.component';
import { ReportedPostNotificationDialog } from 'src/app/dialogs/reported-post-notification-dialog/reported-post-notification-dialog.component';
import { AppliedPostNotificationDialog } from 'src/app/dialogs/applied-post-notification-dialog/applied-post-notification-dialog.component';
import { PostRejectedDialog } from 'src/app/dialogs/post-rejected-dialog/post-rejected-dialog.component';
import { PostCompletedDialog } from 'src/app/dialogs/post-completed-dialog/post-completed-dialog.component';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-post-feed',
  templateUrl: './posts-feed.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  styleUrls: ['./posts-feed.component.scss'],
})
export class PostFeedComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  filteredPosts: Post[] = [];

  hasApproved: boolean = null;
  startDate: Date;
  endDate: Date;
  noFilteredPost: boolean = null;
  panelOpenState: boolean = false;

  private authStatusObject: {
    auth: boolean;
    name: string;
    email: string;
    admin: boolean;
    beneficiaries: string[];
    verified: boolean;
  };

  private studentApplyObject: {
    name: string;
    email: string;
    contact: number;
    content: string;
    applicationUser: string;
  }

  private studentReportObject: {
    name: string;
    email: string;
    contact: number;
    content: string;
  }

  /* Application FormGroup */
  public applicationForm: FormGroup;
  public applicationContactControl = new FormControl(null, [Validators.required, Validators.min(10000000), Validators.max(99999999)]);
  public applicationContentControl = new FormControl(null, [Validators.required]);
  public applicationUserTypeControl = new FormControl(null, [Validators.required]);

  /* Report FormGroup */
  public reportForm: FormGroup;
  public reportContactControl = new FormControl(null, [Validators.required, Validators.min(10000000), Validators.max(99999999)]);
  public reportContentControl = new FormControl(null, [Validators.required, ]);

  /* Reject FormGroup */
  public rejectForm: FormGroup;
  public rejectReasonControl = new FormControl(null);

  /* Remove / Complete FormGroup */
  public removeForm: FormGroup;
  public removeReasonControl = new FormControl(null);

  private postSub: Subscription;
  private authStatusSub: Subscription;

  beneficiaries: string[] = [
    'Animal Welfare',
    'Arts & Heritage',
    'Children & Youth',
    'Community',
    'Disability',
    'Education',
    'Elderly',
    'Environment',
    'Families',
    'Health',
    'Humanitarian',
    'Social Service',
    'Sports',
    'Women & Girls',
  ];

  public beneficiariesBoolean: { beneficiary: string, selected: boolean }[] = [
    {
      beneficiary: 'Animal Welfare',
      selected: false,
    },
    {
      beneficiary: 'Arts & Heritage',
      selected: false,
    },
    {
      beneficiary: 'Children & Youth',
      selected: false,
    },
    {
      beneficiary: 'Community',
      selected: false,
    },
    {
      beneficiary: 'Disability',
      selected: false,
    },
    {
      beneficiary: 'Education',
      selected: false,
    },
    {
      beneficiary: 'Elderly',
      selected: false,
    },
    {
      beneficiary: 'Environment',
      selected: false,
    },
    {
      beneficiary: 'Families',
      selected: false,
    },
    {
      beneficiary: 'Health',
      selected: false,
    },
    {
      beneficiary: 'Humanitarian',
      selected: false,
    },
    {
      beneficiary: 'Social Service',
      selected: false,
    },
    {
      beneficiary: 'Sports',
      selected: false,
    },
    {
      beneficiary: 'Women & Girls',
      selected: false,
    }
  ]



  beneficiariesSelected: string[] = [];
  keywords: string = "";

  orgs: string[] = [];
  public orgsBoolean: { org: string, selected: boolean }[] = [];

  orgsSelected: string[] = [];

  //chips stuff
  /*
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  */

  constructor(
    public postsService: PostsService,
    private modalService: NgbModal,
    private authService: AuthService,
    public dialog: MatDialog,
  ) {

    this.applicationForm = new FormGroup({
      contact: this.applicationContactControl,
      content: this.applicationContentControl,
      applicationUser: this.applicationUserTypeControl,
    });

    this.reportForm = new FormGroup({
      contact: this.reportContactControl,
      content: this.reportContentControl,
    });

    this.rejectForm = new FormGroup({
      reason: this.rejectReasonControl,
    });

    this.removeForm = new FormGroup({
      reason: this.removeReasonControl,
    });
  }

  ngOnInit() {
    this.postsService.getPosts();

    this.authStatusObject = this.authService.getAuthStatusObject();

    this.postSub = this.postsService
      .getPostsUpdatedListener()
      .subscribe((posts: Post[]) => {
        this.posts = [];
        this.filteredPosts = [];

        //show latest requested posts at the top of the timeline
        for (var i = posts.length - 1; i >= 0; i--) {
          if (posts[i].approved && !posts[i].removed) {
            this.posts.push(posts[i]);
            this.filteredPosts.push(posts[i]);
          }
        }

        if (this.posts.filter((post) => post.approved).length > 0) {
          this.hasApproved = true;
        } else {
          this.hasApproved = false;
        }
        this.orgs = this.posts.map(post => post.orgName);
        //console.log(this.orgs);
        for (let i = 0; i < this.orgs.length; i++) {
          this.orgsBoolean.push({
            org: this.orgs[i],
            selected: false,
          });
        }
      });
  }

  onDeletePrompt(content) {
    this.modalService.open(content, { size: 'lg' });
  }

  onDelete(postId: string) {
    this.postsService.deletePost(postId);
    return true;
  }

  onCompletePrompt(completePrompt) {
    this.modalService.open(completePrompt, { size: 'lg' });
  }

  onComplete(postId: string) {
    this.postsService.completePost(postId, this.removeForm.value.reason);
    this.removeForm.reset();
    this.dialog.open(PostCompletedDialog);
    return true;
  }

  onRejectPrompt(rejectPrompt) {
    this.modalService.open(rejectPrompt, { size: 'lg' });
  }

  onReject(postId: string) {
    this.postsService.rejectPost(postId, this.rejectForm.value.reason);
    this.dialog.open(PostRejectedDialog);
    return true;
  }

  onMoreInfo(content) {
    this.modalService.open(content, { size: 'lg' });
    //console.log("The posts are: ");
    //console.log(this.posts);
    //console.log("This authStatusObject is: ");
    //console.log(this.authStatusObject);
  }

  clearFilter() {
    this.beneficiariesSelected = [];
    this.orgsSelected = [];
    this.keywords = "";
    this.startDate = null;
    this.endDate = null;
    for (let i = 0; i < this.beneficiariesBoolean.length; i++) {
      this.beneficiariesBoolean[i].selected = false;
    }
    for (let i = 0; i < this.orgsBoolean.length; i++) {
      this.orgsBoolean[i].selected = false;
    }
    this.submitFilter();
  }

  submitFilter() {

    /*
    let weirdText: string = "Ss!@#$%^&*(){}:\"<>~`"
    let lowerWeirdText = weirdText.toLowerCase();
    console.log(weirdText);
    console.log(lowerWeirdText);
    */

    for (let i = 0; i < this.beneficiariesBoolean.length; i++) {
      if (this.beneficiariesBoolean[i].selected) {
        if (this.beneficiariesSelected.includes(this.beneficiariesBoolean[i].beneficiary)) {
          continue;
        }
        this.beneficiariesSelected.push(this.beneficiariesBoolean[i].beneficiary);
      }
      if (!this.beneficiariesBoolean[i].selected && this.beneficiariesSelected.includes(this.beneficiariesBoolean[i].beneficiary)) {
        this.beneficiariesSelected = this.beneficiariesSelected.filter(beneficiary => beneficiary != this.beneficiariesBoolean[i].beneficiary);
      }
    }

    for (let i = 0; i < this.orgsBoolean.length; i++) {
      if (this.orgsBoolean[i].selected) {
        if (this.orgsSelected.includes(this.orgsBoolean[i].org)) {
          continue;
        }
        this.orgsSelected.push(this.orgsBoolean[i].org);
      }
      if (!this.orgsBoolean[i].selected && this.orgsSelected.includes(this.orgsBoolean[i].org)) {
        this.orgsSelected = this.orgsSelected.filter(org => org != this.orgsBoolean[i].org);
      }
    }

    //console.log(this.orgsSelected);

    if (this.beneficiariesSelected.length !== 0) {
      this.filteredPosts = this.posts.filter((post) => {
        return this.beneficiariesSelected.includes(post.beneficiaries);
      });
    } else {
      this.filteredPosts = [...this.posts];
      //console.log(this.filteredPosts);
    }






    if (this.startDate) {
      //console.log("There is a startDate!");
      this.filteredPosts = this.filteredPosts
        .filter((post) => {
          return ( new Date(post.startDate).getTime() >= new Date(this.startDate).getTime());
      });
    }

    if (this.endDate) {
      //console.log("There is an endDate!");
      this.filteredPosts = this.filteredPosts.filter(
        (post) =>
          new Date(post.endDate).getTime() <= new Date(this.endDate).getTime()
      );
    }
    //Need to cast new Date object over it again... KIV for future me. I have no idea why javascript does this (┛ಠ_ಠ)┛彡┻━┻

    if (this.keywords !== "") {
      this.filteredPosts = this.filteredPosts.filter(post => {
        return (this.KnuthMorrisPrattSearch(this.keywords, post.content) != -1) || (this.KnuthMorrisPrattSearch(this.keywords, post.title) != -1);
      });
    }

    if (this.orgsSelected.length !== 0) {
      this.filteredPosts = this.filteredPosts.filter(post => {
        for (let i = 0; i < this.orgsSelected.length; i++) {
          if (this.orgsSelected[i] === post.orgName) {
            return true;
          }
        }
      });
    }

    if (this.filteredPosts.length === 0) {
      this.noFilteredPost = true;
    } else {
      this.noFilteredPost = false;
    }
  }

  //credits to https://stackoverflow.com/questions/1789945/how-to-check-whether-a-string-contains-a-substring-in-javascript
  KnuthMorrisPrattSearch(pattern: string, text: string) {

    // Immediate match
    if (pattern.length == 0) {
      return 0;
    }

    //convert them all to lowercase first.
    let lowerPattern: string = pattern.toLowerCase();
    let lowerText: string = text.toLowerCase();

    // Compute longest suffix-prefix table
    var lsp = [0]; // Base case
    for (var i = 1; i < pattern.length; i++) {
      var j = lsp[i - 1]; // Start by assuming we're extending the previous LSP
      while (j > 0 && lowerPattern.charAt(i) != lowerPattern.charAt(j))
        j = lsp[j - 1];
      if (lowerPattern.charAt(i) == lowerPattern.charAt(j))
        j++;
      lsp.push(j);
    }

    // Walk through text string
    var j = 0; // Number of chars matched in pattern
    for (var i = 0; i < text.length; i++) {
      while (j > 0 && lowerText.charAt(i) != lowerPattern.charAt(j))
        j = lsp[j - 1]; // Fall back in the pattern
      if (lowerText.charAt(i) == lowerPattern.charAt(j)) {
        j++; // Next char matched, increment position
        if (j == lowerPattern.length)
          return i - (j - 1);
      }
    }
    return -1; // Not found
  }

  onApply(postId: string, errorMessage: string, studentContent) {

    const currentPost = this.postsService.getPost(postId);
    if (currentPost.students.filter(student => student.email === this.authStatusObject.email).length > 0) {
      //this.modalService.open(errorMessage, { size: 'lg' });
      this.dialog.open(AppliedBeforeDialog);
      return;
    } else {
      //this.postsService.applyPost(postId, this.studentObject);
      this.modalService.open(studentContent, {});
      return;
    }
  }

  submitApplication(postId: string, appForm: NgForm) {
    if (appForm.invalid) {
      return;
    }

    this.studentApplyObject = {
      name: this.authStatusObject.name,
      email: this.authStatusObject.email,
      contact: appForm.value.contactNumber,
      content: appForm.value.message,
      applicationUser: appForm.value.applicationUser,
    };

    this.postsService.applyPost(postId, this.studentApplyObject);
    this.dialog.open(AppliedPostNotificationDialog);
    return true;
  }

  submitApplicationReactive(postId: string) {

    //console.log("Application form sending now! The contents are: ");
    //console.log(this.applicationForm);

    if (this.applicationForm.invalid) {
      console.log("Application Form is not filled up yet or has invalid parts!");
      return;
    }

    this.studentApplyObject = {
      name: this.authStatusObject.name,
      email: this.authStatusObject.email,
      contact: this.applicationForm.value.contact,
      content: this.applicationForm.value.content,
      applicationUser: this.applicationForm.value.applicationUser,
    };

    //console.log("the sutdentApplyObject is: ");
    //console.log(this.studentApplyObject);


    this.postsService.applyPost(postId, this.studentApplyObject);
    this.dialog.open(AppliedPostNotificationDialog);
    this.applicationForm.reset();
    return true;
  }

  applyBefore(currentPost: Post) {
    //console.log("Apply before line fires");
    if (currentPost.students.filter(user => user.email === this.authStatusObject.email).length > 0) {
      return true;
    }
    return false;
  }


  onReport(postId: string, errorMessage: string, reportContent: any) {
    const currentPost = this.postsService.getPost(postId);

    if (currentPost.reports.filter(student => student.email === this.authStatusObject.email).length > 0) {
      //this.modalService.open(errorMessage, { size: 'lg' });
      this.dialog.open(ReportedBeforeDialog);
      //console.log("YOU REPORTED THIS POST BEFORE BEFORE.");
      return;
    } else {
      this.modalService.open(reportContent, {});
      return;
    }
  }

  submitReport(postId: string, reportForm: NgForm) {
    if (reportForm.invalid) {
      //console.log("Still need to fill in the form!");
      return;
    }
    this.studentReportObject = {
      name: this.authStatusObject.name,
      email: this.authStatusObject.email,
      contact: reportForm.value.contactNumber,
      content: reportForm.value.message,
    };
    this.postsService.reportPost(postId, this.studentReportObject);
    this.dialog.open(ReportedPostNotificationDialog);
    return true;
  }

  submitReportReactive(postId: string) {

    //console.log(this.reportForm);

    if (this.reportForm.invalid) {
      console.log("Report Form is not filled up yet or has invalid parts!");
      return;
    }

    this.studentReportObject = {
      name: this.authStatusObject.name,
      email: this.authStatusObject.email,
      contact: this.reportForm.value.contact,
      content: this.reportForm.value.content,
    };

    this.postsService.reportPost(postId, this.studentReportObject);
    this.dialog.open(ReportedPostNotificationDialog);
    return true;
  }

  reportBefore(currentPost: Post) {
    //console.log("reportBefore's line fires");
    if (currentPost.reports.filter(user => user.email === this.authStatusObject.email).length > 0) {
      return true;
    }
    return false;
  }


  ngOnDestroy() {
    this.postSub.unsubscribe();
  }
}
