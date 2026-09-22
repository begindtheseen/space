---
id: l05-applicant-tracking-systems
title: "Formatting so a parser reads it correctly"
minutes: 16
covers:
  - "applicant tracking system parsing: no tables, no multi-column layouts, no images, standard headings, PDF"
---

Everything in the previous four lessons assumed a human being eventually reads your words. This lesson is about a narrower, less interesting, and more consequential question that sits in front of that assumption: does the software many employers use to collect and organize applications extract your words correctly in the first place. A resume can have a flawless top third, perfectly encoded basic qualifications, and four rewritten bullets that would convince any GNC reader — and still fail here, silently, before any of that content is ever seen.

That word, silently, is the reason this lesson exists as its own lesson rather than as a footnote to the others. A parsing failure does not produce an error message you can fix. It produces an application that goes nowhere, and you are left with no information about why — indistinguishable, from where you sit, from an application that was read carefully and passed over on its merits. The only defense against a failure you will never be told about is not producing it in the first place, which means formatting the file itself with the same discipline you have already given its content.

## Standard headings

Use the section names a reader — human or software — already expects: Education, Projects, Experience, Skills. Not "What I've Built," not "My Journey So Far," not a heading engineered to sound distinctive. A creative heading asks whatever is reading the document to infer what a section is for, and inference is exactly the step that fails silently when the reader is a program rather than a person. A standard heading costs you nothing stylistically — the content underneath it is still entirely yours — and it removes one entire category of parsing risk for free.

## No tables, no multi-column layouts

A document with two side-by-side columns looks perfectly ordinary to a human eye, because a human eye follows the visual layout automatically. Software that extracts text from a document often works differently: many extraction methods read a page as a stream of text positioned by coordinates, and depending on the specific method, that stream is not guaranteed to follow your intended left-column-then-right-column reading order. Left and right column content can interleave, so that a line from your Skills column and a line from your unrelated Experience column end up adjacent in the extracted text, mid-thought, as if they were one continuous sentence. A table has the same risk for the same reason: a cell's content is positioned, not sequenced, and a reader downstream may or may not reconstruct your intended row-by-row order.

Practice on this genuinely varies. Some extraction methods handle multi-column layouts correctly; others do not, and the difference often is not something you can predict from the outside or test without the specific system in front of you. You have no reliable way to know, for any given application, which kind of system — if any — stands between your submitted file and the first person who opens it. That uncertainty is exactly why this lesson does not offer a conditional rule like "columns are fine if the system is modern enough." Design for the least forgiving case: a single column, top to bottom, in the order you want it read, with no table anywhere on the page.

::: key
Some parsers handle multi-column layouts and tables correctly, and some interleave their content into a garbled stream. Because you cannot know in advance which kind stands between you and a reader for any given application, a single-column, top-to-bottom layout with no tables removes the risk entirely rather than betting on it.
:::

## No images

A headshot, a company or university logo, an icon used in place of a section heading, a QR code, or the proficiency-bar graphic from an earlier lesson in this module all share one property: whatever information they carry is conveyed visually, not as text. A program that extracts and searches text from a document extracts nothing from a picture — there is no text there to find, no matter how meaningful the image looks to a person's eye. If a piece of information matters, and it very often does, it has to exist somewhere on the page as actual characters, not as pixels arranged to look like characters or ideas.

This is the same underlying reason the proficiency-bar skills list from an earlier lesson in this module was a poor choice, restated here in its more general form: a graphic can look informative to a human skimming quickly while being entirely invisible to anything reading the document as text. The fix is the same fix in both cases — say it in words.

## PDF, exported so the text stays text

Export your final resume to PDF, but be precise about what that means. A PDF produced from a normal text-based document — a word processor file, a simple markup or typesetting source, an HTML page rendered to PDF — preserves its text as text: selectable, searchable, and extractable by any downstream system. A PDF produced by scanning a printed page, or by certain resume-builder templates that render the whole page as a single flattened image, can look visually identical to a person while containing no extractable text at all. To a person, both files look the same. To anything reading the document as text, one is a resume and the other is a blank page with a picture on it.

::: warning A visually perfect PDF can still be functionally empty
The only way to know for certain which kind of file you have produced is to check it directly — visual inspection, even careful visual inspection, cannot tell the difference between selectable text and an image of text. Always verify before you submit anything.
:::

## The self-test: read what a machine would read

Before submitting any version of your resume, run one simple check yourself: open the exported PDF, select all of its text, copy it, and paste it into a plain text editor with no formatting of its own. Then read what comes out, top to bottom, exactly as it appears.

You are checking for three things. First, that any text appears at all — an empty or near-empty paste means you have produced an image rather than a document, and nothing downstream will fare any better than this attempt did. Second, that the section headings and content appear in the order you intended, rather than interleaved or scrambled — this is where a hidden column or table problem reveals itself, because the pasted text follows the same extraction logic many parsing systems use. Third, that nothing is missing — a text box, a header, or a graphic element some tools place outside the normal document flow can be invisible to a simple text extraction even when it displays correctly on screen. If what you read in the plain text editor is a faithful, correctly ordered, complete copy of your resume's content, you have strong evidence the file will hold up wherever it is sent; if it is not, you have found the problem yourself, in your own kitchen, rather than losing an application to it silently.

::: example How a two-column layout can scramble on extraction
A candidate's resume places Skills and Education in a narrow left column and Experience and Projects in a wider right column, side by side, for the full height of the page. Visually this reads cleanly, top to bottom, one column at a time.

One plausible way a coordinate-based text extraction reconstructs this page is by reading across the page at each vertical position rather than down one column fully before starting the next — producing a paste that looks something like: "Skills: Python, C++ Senior Project Lead, ACME Robotics Club Education: B.S. in progress Designed a 6-DOF simulation..." Skills and Education lines from the left column are now interleaved with Experience and Projects lines from the right column, mid-sentence, with no visual cue left to show where one section ended and the next began. Not every system behaves this way — but a candidate who has not tested her own file has no way to know whether hers does, which is the entire argument for avoiding the layout rather than gambling on a specific system's behavior.
:::

::: example Running the self-test on a finished resume
A candidate finishes her one-page, single-column resume and exports it to PDF from her word processor. Before submitting anywhere, she opens the PDF, selects all the text, copies it, and pastes it into a plain text editor. What comes out reads, in order: her name and contact line, her identity statement, the Education line, each Projects entry with its bullets in the correct order, the Skills categories, and the Experience entry — matching the visual document exactly, with no missing sections and no interleaved fragments.

This does not prove every system that might ever receive this file will read it identically — she cannot test every system that exists. It does show that the file itself contains clean, correctly ordered, complete text with nothing hidden in an image or scrambled by a layout choice, which removes the layout-and-formatting causes of a silent failure entirely, leaving only genuinely unpredictable factors outside her control.
:::

## Check yourself

::: check
Why is a parsing failure a more serious problem for an applicant than a resume with a merely mediocre bullet or two, even though both might result in the same outcome — no response?
:::

::: answer
A mediocre bullet is at least read and weighed, even if it does not fully persuade; a parsing failure means the content was never actually delivered to a reader in usable form at all. Worse, a parsing failure produces no error message and looks, from the applicant's side, identical to an application that was read and declined on its merits — so it cannot be diagnosed or corrected after the fact the way weak content can be revised for the next application.
:::

::: check
Explain the mechanism by which a two-column resume layout can produce a garbled text extraction, even though the document looks completely normal on screen.
:::

::: answer
Many text-extraction methods read a document as a stream of text positioned by coordinates on the page rather than by following the visual column structure a human eye tracks automatically. Depending on the specific method, content can be extracted by reading across the page at each vertical position, which interleaves a line from the left column with a line from the right column that happens to sit at a similar height — producing a jumbled, out-of-order stream even though the original layout was visually clean and intentional.
:::

::: check
A proficiency-bar skills graphic and a small company or university logo placed near the header seem unrelated, but this lesson treats them as the same underlying problem. What do they have in common?
:::

::: answer
Both convey their information visually rather than as extractable text — a bar graphic communicates a claimed skill level through shaded shapes, and a logo communicates an affiliation through an image, and neither exists as characters a text-based system can find or search. Anything meaningful that exists only as a picture is invisible to anything reading the document as text, regardless of how clear it looks to a person's eye, which is why both should be replaced with the same information stated in words.
:::

::: check
What is the practical difference between a PDF exported from a normal text-based document and a PDF that is effectively "a picture of text," and why can a candidate not tell the difference by looking at the file alone?
:::

::: answer
A PDF from a text-based source preserves its content as selectable, searchable text, extractable by any downstream system exactly as written. A PDF that is effectively a picture of text — produced by scanning a page or by certain template tools that flatten the whole layout into an image — displays identical characters to a viewer but contains no underlying text at all, only pixels arranged to resemble it. Visual inspection cannot distinguish the two, because both render identically on screen; only checking whether the text can actually be selected and copied reveals which one you have.
:::

::: check
Describe the self-test a candidate should run on her own exported resume before submitting it anywhere, and name the three things she is specifically checking for.
:::

::: answer
She should open the exported PDF, select all of its text, copy it, and paste it into a plain text editor with no formatting of its own, then read what comes out. She is checking, first, that meaningful text appears at all rather than an empty paste; second, that headings and content appear in the correct, unscrambled order rather than interleaved fragments from a column or table layout; and third, that nothing is missing that displayed correctly on screen but did not survive extraction.
:::

## Summary

| Element | Risk if used | Fix |
| --- | --- | --- |
| Creative section headings | Software may not recognize what the section is for | Use standard names: Education, Projects, Experience, Skills |
| Multi-column layout or tables | Content can interleave into a garbled, out-of-order stream | Single column, top to bottom, in your intended reading order |
| Images: logos, icons, QR codes, proficiency bars | Information conveyed only visually is invisible to text extraction | State the same information in plain text |
| Scanned or template-flattened PDF | The file may contain no extractable text at all | Export from a text-based source; verify text is selectable |
| Unverified final file | A parsing failure produces no error message, only silence | Select all, copy, and paste into a plain text editor before submitting |

The next lesson returns to content, and to a question format alone cannot answer: how to adjust the same underlying evidence for a specific role family without misrepresenting anything, and when writing a cover letter is actually worth the time it costs.
